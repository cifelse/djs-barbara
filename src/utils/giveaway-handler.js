const { MessageActionRow, MessageButton } = require('discord.js');
const { scheduleJob } = require('node-schedule');
const { hangar } = require('./ids.json');
const { editEmbed } = require('./embeds');
const { saveGiveaway, getParticipants, insertParticipant, checkDuplicateParticipant } = require('../database/database-handler');

async function startGiveaway(interaction, details, client) {
	const embed = editEmbed.giveawayEmbed(interaction, details);
	const row = new MessageActionRow();
	row.addComponents(
		new MessageButton()
			.setCustomId('enter')
			.setLabel('🍷')
			.setStyle('PRIMARY'),
	);
	const channel = interaction.guild.channels.cache.get(details.channel_id);
	const message = await channel.send({ embeds: [embed], components: [row], fetchReply: true });

	details.giveaway_id = message.id;
	details.start_date = new Date().toString();
	details.num_entries = 0;

	saveGiveaway(details);
	scheduleGiveaway(client, [details]);
	await interaction.reply({ content: 'Giveaway successfully launched!', ephemeral: true });
}

function scheduleGiveaway(client, details) {
	for (let i = 0; i < details.length; i++) {
		const currentDate = new Date().getTime();
		const endDate = Date.parse(details[i].end_date);

		if (endDate < currentDate) continue;
		const { title, num_winners, end_date, channel_id, giveaway_id } = details[i];
		console.log('Scheduling giveaway for', end_date);
	
		scheduleJob(end_date, async () => {
			getParticipants(giveaway_id, async users => {
				const winners = determineWinners(users, num_winners);
	
				// Put winners in string
				let winnerString = '';
		
				if (winners.length > 0) {
					winners.forEach(winner => {
						winnerString += `<@${winner.discord_id}> `;
					});
				}
				
				// Get channel and message to edit and announce winners
				const channel = client.channels.cache.get(channel_id);
				if (channel) {
					const message = await channel.messages.fetch(giveaway_id);
					if (message) {
						const rerollButton = message.components[0].components[0].setCustomId('reroll').setLabel('Reroll').setStyle('DANGER');
						const newEmbed = message.embeds[0];
						newEmbed.setColor('RED');
						newEmbed.setFooter({ text: `${message.id}` });
						newEmbed.spliceFields(0, 4, [
							{ name: '_ _\nEnded', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }, 
							{ name: '_ _\nWinner/s', value: `${winnerString}`, inline: true },
						]);
						
						if (winners.length === 0) {
							newEmbed.setDescription('**Giveaway has ended.** Sadly, no one joined the giveaway so no one won. 😢');
							rerollButton.setDisabled(true);
							const newRow = new MessageActionRow();
							newRow.addComponents(rerollButton);
							message.edit({ embeds:[newEmbed], components: [newRow] });
						}
						else {
							newEmbed.setDescription('**Giveaway has ended.** Congratulations to the winner/s! 🎉');
							const newRow = new MessageActionRow();
							newRow.addComponents(rerollButton);
							message.edit({ embeds:[newEmbed], components: [newRow] });
							channel.send(`Congratulations to ${winnerString}for winning **"${title}"** 🎉\n\n**Important Note:**\nMake sure to register a passport. Just in case you haven't, you can do that at <#915156513339891722>. *Failure to do so will disqualify you from this giveaway.*`);
						}
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

function addEntries(interaction, roles) {
	// Check for Multiplier
	const multiplierField = interaction.message.embeds[0].fields.find(field => field.name.includes('Multipliers'));
	
	// Collect Participant's info
	const messageId = interaction.message.id;
	const { id, username, discriminator } = interaction.user;
	const participant = { giveawayId: messageId, discordId: id, username, discriminator };
	
	if (!multiplierField) {
		insertParticipant(participant);
		return;
	}

	let multiplier;

	if (roles.get(hangar.roles.aircraftEngineers)) multiplier = 2;
	if (roles.get(hangar.roles.core)) multiplier = 3;
	if (roles.get(hangar.roles.head)) multiplier = 4;
	
	for (let i = 0; i < multiplier; i++) {
		insertParticipant(participant);
	}
}

async function checkEligibility(interaction) {
	if (interaction.user.bot) return false;

	const requirementsField = interaction.message.embeds[0].fields.find(field => field.value.includes('Free for All'));
	if (requirementsField) return true;

	const eligible = interaction.member.roles.cache.some(role => role.id === hangar.roles.aircraftEngineers || role.id === hangar.roles.core || role.id === hangar.roles.head);

	return eligible;
}

function determineWinners(users, winnerCount) {
	const winners = [];
	let sentinel = 0;

	while (winners.length < winnerCount && sentinel < users.length) {
		const random = Math.floor(Math.random() * users.length);
		const duplicate = winners.find(winner => winner.discord_id === users[random].discord_id);
		if (!duplicate) winners.push(users[random]);
		sentinel++;
	}
	return winners;
}

async function reroll(interaction) {
	const messageId	= interaction.message.embeds[0].footer.text;
	const title = interaction.message.embeds[0].title;

	await interaction.reply({ content: 'Enter number of winners for reroll.', ephemeral: true });
	const response = await interaction.channel.awaitMessages({ max: 1 });
	const { content } = response.first();
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

		await interaction.channel.send(`Congratulations to ${winnerString}for winning **"${title}"** 🎉\n\n**Important Note:**\nMake sure to register a passport. Just in case you haven't, you can do that at <#915156513339891722>. *Failure to do so will disqualify you from this giveaway.*`);
	});
}

module.exports = { saveGiveaway, startGiveaway, enterGiveaway, scheduleGiveaway, reroll };