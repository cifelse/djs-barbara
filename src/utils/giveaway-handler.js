const { MessageActionRow, MessageButton } = require('discord.js');
const { scheduleJob } = require('node-schedule');
const { hangar } = require('./ids.json');
const { editEmbed } = require('./embeds');
const ms = require('ms');
const { saveGiveaway, getParticipants, insertParticipant, getGiveaway } = require('../database/database-handler');

async function startGiveaway(interaction, client, details) {
	const embed = editEmbed.giveawayEmbed(interaction, details);
	const row = new MessageActionRow();
	row.addComponents(
		new MessageButton()
			.setCustomId('enter')
			.setLabel('🍷 0')
			.setStyle('PRIMARY'),
	);
	const channel = interaction.guild.channels.cache.get(details.channelId);
	const message = await channel.send({ embeds: [embed], components: [row], fetchReply: true });

	details.messageId = message.id;
	details.endsOn = new Date(Date.now() + ms(details.duration)).toString();
	details.createdOn = new Date().toString();
	details.entries = 0;

	saveGiveaway(details);
	scheduleGiveaway(client, details.messageId);
	await interaction.reply({ content: 'Giveaway successfully launched!', ephemeral: true });
}

function scheduleGiveaway(client, giveaway) {
	const details = getGiveaway(giveaway);
	console.log(details);
	console.log('Scheduling job for', details.end_date);

	scheduleJob(details.end_date, async () => {
		const winners = determineWinners(details.participants, details.winnerCount);
		details.participants = {};
		details.entries = 0;
	
		let winnerString = '';
	
		if (winners.size === 0) {
			winnerString = 'None';
		}
		else {
			winners.forEach(winner => {
				winnerString += `<@${winner.id}> `;
			});
		}
		
		const channel = client.channels.cache.get(hangar.channels.barbaraTest);
		const fetchedMessages = await channel.messages.fetch();
		const message = fetchedMessages.get(details.messageId);

		const rerollButton = message.components[0].components[0].setCustomId('reroll').setLabel('Reroll').setStyle('DANGER');
		const newEmbed = message.embeds[0];
		newEmbed.setColor('RED');
		newEmbed.spliceFields(0, 4, [
			{ name: '_ _\nEnded', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }, 
			{ name: '_ _\nWinner/s', value: `${winnerString}`, inline: true },
		]);
		
		if (winners.size === 0) {
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
			channel.send(`Congratulations to ${winnerString}for winning **"${details.title}"** 🎉\n\n**Important Note:**\nMake sure to register a passport. Just in case you haven't, you can do that at <#915156513339891722>. *Failure to do so will disqualify you from this giveaway.*`);
		}
	});
}

async function enterGiveaway(interaction, details) {
	// Check if the participant is eligible to join the giveaway
	if (interaction.user.bot) return;
	const eligible = interaction.member.roles.cache.some(role => {
		if (role.id === hangar.roles.aircraftEngineers || role.id === hangar.roles.core || role.id === hangar.roles.head) return true;
		return false;
	});
	if (!eligible) {
		await interaction.reply({ content: 'You are not eligible to participate in this giveaway yet.', ephemeral: true });
		return;
	}
	// Check for duplicates in participants
	console.log(details);
	const duplicate = interaction.user.id in details.participants;
	if (duplicate) {
		await interaction.reply({ content: 'You already participated in this giveaway.', ephemeral: true });
		return;
	}
	// Add participants
	const roles = interaction.member.roles.cache;
	addEntries(interaction, roles, details);
	
	const newButton = interaction.message.components[0].components[0].setLabel(`🍷 ${details.entries}`);
	const row = new MessageActionRow();
	row.addComponents(newButton);
	await interaction.update({ components: [row] });
	await interaction.followUp({ content: 'You have successfully joined the giveaway!', ephemeral: true });
}

function addEntries(interaction, roles) {
	let multiplier;

	if (roles.get(hangar.roles.aircraftEngineers)) multiplier = 2;
	if (roles.get(hangar.roles.core)) multiplier = 3;
	if (roles.get(hangar.roles.head)) multiplier = 4;
	const messageId = interaction.message.id;
	const { discordId, username, discriminator } = interaction.user;
	
	for (let i = 0; i < multiplier; i++) {
		insertParticipant(messageId, discordId, username, discriminator);
	}
}

function determineWinners(users, winnerCount) {
	const participants = getParticipants();
	console.log(participants);
	
	const winners = new Set();
	let sentinel = 0;

	while (winners.size < winnerCount && sentinel < users.length) {
		const random = Math.floor(Math.random() * users.length);
		winners.add(users[random]);
		sentinel++;
	}
	return winners;
}

module.exports = { saveGiveaway, startGiveaway, enterGiveaway, scheduleGiveaway };