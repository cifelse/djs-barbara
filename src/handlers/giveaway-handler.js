import { MessageActionRow, MessageButton } from 'discord.js';
import { scheduleJob } from 'node-schedule';
import { saveGiveaway, getParticipants, insertParticipant, checkDuplicateParticipant, getEntries, updateEntries, getGiveaways, insertGiveawayWinner } from '../database/giveaway-db.js';
import { CronJob } from 'cron';
import { keys } from '../utils/keys.js';
import { announceGiveawayWinners, editGiveawayLog, giveawayEmbed, giveawayLogsEmbed } from '../utils/embeds/entertainment-embeds.js';

// Get Necessary Keys
const { roles: { admin, ram, levels: { frequentFlyers, premiumEconomy, businessClass, jetsetters } }, channels: { giveaway, logs: { giveawayLogs } } } = keys.concorde;

export const startGiveaway = async (interaction, details, client) => {
	// Create and Send Message Embed
	const embed = giveawayEmbed(interaction, details);
	const row = new MessageActionRow();
	row.addComponents(
		new MessageButton()
			.setCustomId('enter')
			.setLabel('🍷 0')
			.setStyle('PRIMARY'),
	);
	const channel = interaction.guild.channels.cache.get(details.channel_id);
	const message = await channel.send({ embeds: [embed], components: [row], fetchReply: true });

	details.giveaway_id = message.id;
	details.num_entries = 0;
	
	saveGiveaway(details, () => {
		getGiveaways(giveaways => {
			const lastItem = giveaways[giveaways.length - 1];
			scheduleGiveaway(client, [lastItem]);
		});
	});
	
	await interaction.reply({ content: `Giveaway successfully launched for **"${details.title}"**!` });

	// Edit embed and send to Giveaway Logs
	const logsEmbed = giveawayLogsEmbed(embed, message, details);
	const logsChannel = interaction.guild.channels.cache.get(giveawayLogs);
	await logsChannel.send({ embeds: [logsEmbed] });
}

export const scheduleGiveaway = async (client, details) => {
	for (let i = 0; i < details.length; i++) {
		const { title, num_winners, end_date, channel_id, giveaway_id } = details[i];
		
		// Check if Giveaway is already finished
		const currentDate = new Date().getTime();
		if (end_date.getTime() < currentDate) continue;
		
		console.log('Barbara: Alert! I\'m Scheduling a Giveaway for', title);
		
		// Get channel and message to edit and announce winners
		const channel = await client.channels.fetch(channel_id);
		let message;
		if (channel) message = await channel.messages.fetch(giveaway_id);
		
		const watchEntries = new CronJob('* * * * * *', () => {
			getEntries(giveaway_id, async (result) => {
				const entries = result[0].num_entries;
				const newButton = message.components[0].components[0];

				// Check for number of entries
				if (entries == newButton.label.replace(/[^\d]+/gi, '')) return;

				console.log(`Barbara: There are a total of ${entries} giveaway participants now!`);

				newButton.setLabel(`🍷 ${entries}`);
				const row = new MessageActionRow();
				row.addComponents(newButton);
				await message.edit({ components: [row] });
			});
		});
		watchEntries.start();
	
		scheduleJob(end_date, async () => {
			watchEntries.stop();
			getParticipants(giveaway_id, async users => {
				const winners = determineWinners(users, num_winners);
	
				// Put winners in string
				let winnerString = '';

				if (winners.length > 0) {
					winners.forEach(winner => {
						winnerString += `<@${winner.discord_id}> `;
						insertGiveawayWinner(giveaway_id, winner);
					});
				}
				else {
					winnerString = 'None';
				}
				
				if (channel && message) {
					await announceGiveawayWinners(channel, message, winnerString, title);
					await editGiveawayLog(client, details[i], message, winnerString);
				}
			});
		});
	}
}

export const enterGiveaway = async (interaction) => {
	const eligible = await checkEligibility(interaction);
	if (!eligible) {
		await interaction.reply({ content: 'You are not eligible to participate in this giveaway yet.', ephemeral: true });
		return;
	}
	const messageId = interaction.message.id;
	const participantId = interaction.user.id;

	// Check for duplicates in participants
	checkDuplicateParticipant(messageId, participantId, async (result) => {
		if (result.length >= 1) {
			await interaction.reply({ content: 'You already participated in this giveaway.', ephemeral: true });
			return;
		}

		// Add participants
		const roles = interaction.member.roles.cache;
		addEntries(interaction, roles);

		await interaction.reply({ content: 'You have successfully joined the giveaway!', ephemeral: true });
	});
}

export const addEntries = async (interaction, roles) => {
	// Check for Multiplier
	const multiplierField = interaction.message.embeds[0].fields.find(field => field.name.includes('Multipliers'));
	
	// Collect Participant's info
	const giveawayId = interaction.message.id;
	const discordId = interaction.user.id;
	
	if (!multiplierField) {
		insertParticipant(giveawayId, discordId);
		updateEntries(giveawayId);
		return;
	}

	let multiplier;

	// Set Multiplier
	if (roles.get(jetsetters)) multiplier = 4;
	else if (roles.get(businessClass)) multiplier = 3;
	else if (roles.get(premiumEconomy)) multiplier = 2;
	else if (roles.get(frequentFlyers)) multiplier = 1;
	else multiplier = 1;
	
	for (let i = 0; i < multiplier; i++) {
		insertParticipant(giveawayId, discordId);
	}
	
	updateEntries(giveawayId);
}

export const checkEligibility = async (interaction) => {
	if (interaction.user.bot) return false;

	const requirementsField = interaction.message.embeds[0].fields.find(field => field.value.includes('Free for All'));
	if (requirementsField) return true;

	const eligible = interaction.member.roles.cache.hasAny(frequentFlyers, premiumEconomy, businessClass, jetsetters);

	return eligible;
}

export const determineWinners = (users, winnerCount) => {
    const numWinners = parseInt(winnerCount);
    const winners = [];

	// Shuffle the array before picking the winners
	for (let position = users.length - 1; position > 0; position--) {
		const newPosition = Math.floor(Math.random() * (position + 1));
		const placeholder = users[position];
		users[position] = users[newPosition];
		users[newPosition] = placeholder;
	}

	// Pick the Winners
    while (winners.length < numWinners && users.length > 0) {

        const random = Math.floor(Math.random() * users.length);

		// Check if users[random] is already a winner
        const duplicate = winners.find(winner => winner.discord_id === users[random].discord_id);
        
		// If users[random] is not yet a winner, add the person to the winners array
        if (!duplicate) winners.push(users[random]);

        // Remove the users[random] from the selection of potential winners
        users.splice(random, 1);
    }

	console.log('Barbara: I\'ve successfully chosen the Giveaway winners!');
    return winners;
}

export const rerollGiveaway = async (interaction) => {
	// Check Role
	const eligible = interaction.member.roles.cache.hasAny(admin.captain, admin.crew, ram.engineers, keys.hangar.roles.engineers);
	if (!eligible) {
		await interaction.reply({ content: 'You are not eligible to use this button', ephemeral: true });
		return;
	}

	// Get Necessary Details
	const messageId	= interaction.message.embeds[0].footer.text;
	const title = interaction.message.embeds[0].title;
	const fields = interaction.message.embeds[0].fields;
	
	await interaction.reply({ content: `Enter number of winners for Reroll on **"${title}"**.`, ephemeral: true });
	
	// Get Number of Winners From Message
	const response = await interaction.channel.awaitMessages({ max: 1 });
	const { content } = response.first();
	const numberChecker = /^\d+$/;

	if (!numberChecker.test(content)) {
		await interaction.channel.send({ content: 'You entered an invalid number, honey. Why don\'t you press that Reroll button again?' });
		return;
	}

	// Get Channel Where The Giveaway was hosted
	let channel;
	fields.forEach(async field => {
		if (field.name === '_ _\nChannel') {
			channel = await interaction.guild.channels.cache.get(field.value.replace(/[^\d]+/gi, ''));
		}
	});

	const winnerCount = content;

	getParticipants(messageId, async users => {
		const winners = determineWinners(users, winnerCount);

		// Put winners in string and insert to Database
		let winnerString = '';
		if (winners.length > 0) {
			winners.forEach(winner => {
				winnerString += `<@${winner.discord_id}> `;
				insertGiveawayWinner(messageId, winner);
			});
		}

		// Send Reroll Message with Winners
		await interaction.channel.send(`A Reroll has been requested by <@${interaction.user.id}> on **"${title}"**`);
		await channel.send(`A Reroll has been requested by <@${interaction.user.id}>. Congratulations to the new winners, ${winnerString}for winning **"${title}"** 🎉\n\n**Important Note:**\nMake sure to register a passport. Just in case you haven't, you can do that at <#915156513339891722>. *Failure to do so will disqualify you from this giveaway.*`);
		
		// Delete Response After Sending New Winners
		response.first().delete();
	});
}