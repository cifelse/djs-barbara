const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { scheduleJob } = require('node-schedule');
const { concorde, hangar } = require('./ids.json');
const { editEmbed } = require('./embeds');
const { saveGiveaway, getParticipants, insertParticipant, checkDuplicateParticipant, getEntries, updateEntries } = require('../database/database-handler');
const { CronJob } = require('cron');

async function startGiveaway(interaction, details, client) {
	const embed = editEmbed.giveawayEmbed(interaction, details);
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
	details.start_date = new Date().toString();
	details.num_entries = 0;

	saveGiveaway(details);
	scheduleGiveaway(client, [details]);
	await interaction.reply({ content: `Giveaway successfully launched for **"${details.title}"**!` });

	// Send A Copy on Server Logs
	embed.setDescription(`A giveaway has started. Go to this giveaway by [clicking here.](${message.url})`);
	embed.addField('_ _\nChannel', `<#${details.channel_id}>`);
	embed.fields.forEach(field => {
		if (field.name === '_ _\nDuration') field.name = '_ _\nTime';
	});
	const logsChannel = interaction.guild.channels.cache.get(concorde.channels.serverLogs);
	await logsChannel.send({ embeds: [embed] });
}

async function scheduleGiveaway(client, details) {
	for (let i = 0; i < details.length; i++) {
		const currentDate = new Date().getTime();
		const endDate = Date.parse(details[i].end_date);

		if (endDate < currentDate) continue;
		const { title, num_winners, end_date, channel_id, giveaway_id } = details[i];
		console.log('Scheduling giveaway for', end_date);

		const channel = client.channels.cache.get(channel_id);
		let message;
		if (channel) {
			message = await channel.messages.fetch(giveaway_id);
		}
			
		const watchEntries = new CronJob('* * * * * *', () => {
			getEntries(giveaway_id, async (result) => {
				const entries = result[0].num_entries;
				const newButton = message.components[0].components[0];
				// Check for number of entries
				if (entries === newButton.label.replace(/[^\d]+/gi, '')) return;
				
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
					});
				}
				else {
					winnerString = 'None';
				}
				
				// Get channel and message to edit and announce winners
				if (channel) {
					if (message) {
						// Edit Embed of Giveaway Message
						const editedEmbed = message.embeds[0];
						editedEmbed.setColor('RED');
						editedEmbed.setFooter({ text: `${message.id}` });
						editedEmbed.spliceFields(0, editedEmbed.fields.length, [
							{ name: '_ _\nEnded', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }, 
							{ name: '_ _\nWinner/s', value: `${winnerString}`, inline: true },
						]);
						
						if (winners.length === 0) {
							editedEmbed.setDescription('**Giveaway has ended.** Sadly, no one joined the giveaway so no one won. 😢');
							message.edit({ embeds:[editedEmbed], components: [] });
						}
						else {
							editedEmbed.setDescription('Oh honey, I would like to extend but we need to end at some point. **Congratulations to the winner/s!** 🎉 Make sure to register a passport over at <#915156513339891722> or else I\'ll have to disqualify you. 😉');
							const disabledButton = message.components[0].components[0];
							disabledButton.setDisabled(true);
							const newRow = new MessageActionRow();
							newRow.addComponents(disabledButton);
							message.edit({ embeds:[editedEmbed], components: [newRow] });
							channel.send(`Congratulations to ${winnerString}for winning **"${title}"** 🎉\n\n**Important Note:**\nMake sure to register a passport. Just in case you haven't, you can do that at <#915156513339891722>. *Failure to do so will disqualify you from this giveaway.*`);
						}

						// Create another embed of Giveaway for Server Logs
						const serverLogs = client.channels.cache.get(concorde.channels.serverLogs);
						const row = new MessageActionRow();
						const rerollButton = new MessageButton()
							.setCustomId('reroll')
							.setLabel('Reroll')
							.setStyle('DANGER');
						row.addComponents(rerollButton);

						const newEmbed = new MessageEmbed();
						newEmbed.setTitle(`${title}`);
						newEmbed.setColor('RED');
						newEmbed.setDescription(`Giveaway has ended. Go to this giveaway by [clicking here.](${message.url})`);
						newEmbed.setFooter({ text: `${message.id}` });
						newEmbed.spliceFields(0, newEmbed.fields.length, [
							{ name: '_ _\nEnded', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }, 
							{ name: '_ _\nChannel', value: `<#${channel_id}>`, inline: true },
							{ name: '_ _\nWinner/s', value: `${winnerString}`, inline: false },
						]);
						
						if (winners.length === 0) {
							rerollButton.setDisabled(true);
						}
						const newRow = new MessageActionRow();
						newRow.addComponents(rerollButton);
						serverLogs.send({ embeds:[newEmbed], components: [newRow] });
					}
				}
			});
		});
	}
}

async function enterGiveaway(interaction) {
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

async function addEntries(interaction, roles) {
	// Check for Multiplier
	const multiplierField = interaction.message.embeds[0].fields.find(field => field.name.includes('Multipliers'));
	
	// Collect Participant's info
	const messageId = interaction.message.id;
	const { id } = interaction.user;
	const participant = { giveawayId: messageId, discordId: id };
	
	if (!multiplierField) {
		insertParticipant(participant);
		updateEntries(messageId);
		return;
	}

	let multiplier;

	if (roles.get(concorde.roles.multiplier.jetsetters)) multiplier = 4;
	if (roles.get(concorde.roles.multiplier.businessClass)) multiplier = 3;
	if (roles.get(concorde.roles.multiplier.premiumEcon)) multiplier = 2;
	if (roles.get(concorde.roles.frequentFlyer)) multiplier = 1;
	
	for (let i = 0; i < multiplier; i++) {
		insertParticipant(participant);
	}
	
	updateEntries(messageId);

	// const newButton = interaction.message.components[0].components[0];
	// let entryNumber = newButton.label.replace(/[^\d]+/gi, '');
	// newButton.setLabel(`🍷 ${entryNumber++}`);
	// const row = new MessageActionRow();
	// row.addComponents(newButton);
	// await interaction.message.edit({ components: [row] });
}

async function checkEligibility(interaction) {
	if (interaction.user.bot) return false;

	const requirementsField = interaction.message.embeds[0].fields.find(field => field.value.includes('Free for All'));
	if (requirementsField) return true;

	const eligible = interaction.member.roles.cache.some(role => role.id === concorde.roles.frequentFlyer || role.id === concorde.roles.multiplier.premiumEcon || role.id === concorde.roles.multiplier.businessClass || role.id === concorde.roles.multiplier.jetsetters);

	return eligible;
}

function determineWinners(users, winnerCount) {
    const numWinners = parseInt(winnerCount);
    const winners = [];

    let random;
    // Safety Count to avoid infinite loops
    let exit = users.length; 

    while (winners.length < numWinners && exit > 0) {

        random = Math.floor(Math.random() * users.length);

        const duplicate = winners.find(winner => winner.discord_id === users[random].discord_id);
        
        if (!duplicate) {
            winners.push(users[random]);
            exit = users.length;  
        }
        else {
            exit--;  
        }

        // Whatever the outcome is, remove the person in the users pool.
        users.splice(random, 1);
		if (users.length <= 0) exit = 0;
    }
    return winners;
}

async function reroll(interaction) {
	// Check Role
	const roles = interaction.member.roles.cache;
	if (roles.has(concorde.roles.crew) || roles.has(concorde.roles.headPilot) || roles.has(concorde.roles.aircraftEngineers) || roles.has(hangar.roles.aircraftEngineers)) {
		let channel;
		const messageId	= interaction.message.embeds[0].footer.text;
		const title = interaction.message.embeds[0].title;
		const fields = interaction.message.embeds[0].fields;
		
		await interaction.reply({ content: 'Enter number of winners for reroll.' });
		const response = await interaction.channel.awaitMessages({ max: 1 });
		const { content } = response.first();
		const numberChecker = /^\d+$/;

		if (!numberChecker.test(content)) {
			await interaction.channel.send({ content: 'You entered an invalid number, honey. Why don\'t you press that Reroll button again?' });
			return;
		}

		fields.forEach(async field => {
			if (field.name === '_ _\nChannel') {
				channel = await interaction.guild.channels.cache.get(field.value.replace(/[^\d]+/gi, ''));
			}
		});

		const winnerCount = content;

		getParticipants(messageId, async users => {
			const winners = determineWinners(users, winnerCount);
			// Put winners in string
			let winnerString = '';

			if (winners.length > 0) {
				winners.forEach(winner => {
					winnerString += `<@${winner.discord_id}> `;
				});
			}
			await interaction.channel.send('Done!');
			await channel.send(`A Reroll has been requested by <@${interaction.user.id}>. Congratulations to the new winners, ${winnerString}for winning **"${title}"** 🎉\n\n**Important Note:**\nMake sure to register a passport. Just in case you haven't, you can do that at <#915156513339891722>. *Failure to do so will disqualify you from this giveaway.*`);
		});
	}
	else {
		await interaction.reply({ content: 'You are not eligible to use this button', ephemeral: true });
		return;
	}
}

module.exports = { saveGiveaway, startGiveaway, enterGiveaway, scheduleGiveaway, reroll };