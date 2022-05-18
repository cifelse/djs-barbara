import { MessageActionRow, MessageButton } from 'discord.js';
import { scheduleJob } from 'node-schedule';
import { saveGiveaway, getParticipants, insertParticipant, checkDuplicateParticipant, getEntries, updateEntries, getGiveaways, insertGiveawayWinner } from '../database/giveaway-db.js';
import { CronJob } from 'cron';
import { keys } from '../utils/keys.js';
import { announceGiveawayWinners, editGiveawayLog, giveawayEmbed, giveawayLogsEmbed } from '../utils/embeds/giveaway-embeds.js';
import { determineWinners } from '../utils/entertainment.js';

// Get Necessary Keys
const { roles: { levels: { frequentFlyers, premiumEconomy, businessClass, jetsetters } }, channels: { logs: { giveawayLogs } } } = keys.concorde;

export const startGiveaway = async (interaction, details, client) => {
	// Create and Send Message Embed
	const embed = giveawayEmbed(interaction, details);
	const row = new MessageActionRow();
	row.addComponents(
		new MessageButton()
			.setCustomId('enter-giveaway')
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

export const checkEligibility = async (interaction) => {
	if (interaction.user.bot) return false;

	const requirementsField = interaction.message.embeds[0].fields.find(field => field.value.includes('Free for All'));
	if (requirementsField) return true;

	const eligible = interaction.member.roles.cache.hasAny(frequentFlyers, premiumEconomy, businessClass, jetsetters);

	return eligible;
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