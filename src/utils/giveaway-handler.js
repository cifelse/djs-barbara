const { MessageActionRow, MessageButton } = require('discord.js');
const { scheduleJob } = require('node-schedule');
const { hangar } = require('./ids.json');
const { editEmbed } = require('./embeds');
const ms = require('ms');
const { saveGiveaway, getParticipants, insertParticipant, getGiveaway, checkDuplicateParticipant, getEntries } = require('../database/database-handler');

let participants = [];
let entries = 0;

async function startGiveaway(interaction, details) {
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

	// saveGiveaway(details);
	scheduleGiveaway(interaction, details);
	await interaction.reply({ content: 'Giveaway successfully launched!', ephemeral: true });
}

function scheduleGiveaway(interaction, details) {
	const { title, winnerCount, endsOn, channelId, messageId } = details;
	console.log('Scheduling giveaway for', endsOn);

	scheduleJob(endsOn, async () => {
		const winners = determineWinners(participants, winnerCount);
		let winnerString = '';
	
		if (winners.length === 0) {
			winnerString = 'None';
		}
		else {
			winners.forEach(winner => {
				winnerString += `<@${winner.discordId}> `;
			});
		}
		
		const channel = interaction.guild.channels.cache.get(channelId);
		const fetchedMessages = await channel.messages.fetch();
		const message = fetchedMessages.get(details.messageId);

		const rerollButton = message.components[0].components[0].setCustomId('reroll').setLabel('Reroll').setStyle('DANGER');
		const newEmbed = message.embeds[0];
		newEmbed.setColor('RED');
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
	});
}

function scheduleOnGoingGiveaways(client, giveaways) {
	const details = getGiveaway(giveaways);
	console.log(details);
	console.log('Scheduling job for', details.end_date);

	scheduleJob(details.end_date, async () => {
		const winners = determineWinners(participants, details.winnerCount);
		participants = [];
		entries = 0;
	
		let winnerString = '';
	
		if (winners.size === 0) {
			winnerString = 'None';
		}
		else {
			winners.forEach(winner => {
				winnerString += `<@${winner.discord_id}> `;
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
			channel.send(`Congratulations to ${winnerString}for winning **"${details.title}"** 🎉\n\n**Important Note:**\nMake sure to register a passport. Just in case you haven't, you can do that at <#915156513339891722>. *Failure to do so will disqualify you from this giveaway.*`);
		}
	});
}

async function enterGiveaway(interaction) {
	const eligible = await checkEligibility(interaction);
	console.log(eligible);
	if (!eligible) {
		await interaction.reply({ content: 'You are not eligible to participate in this giveaway yet.', ephemeral: true });
		return;
	}
	
	// Check for duplicates in participants
	const duplicate = participants.find(participant => participant.discordId === interaction.user.id);
	if (duplicate) {
		await interaction.reply({ content: 'You already participated in this giveaway.', ephemeral: true });
		return;
	}
	
	// Add participants
	const roles = interaction.member.roles.cache;
	addEntries(interaction, roles);
	
	// Increment Entry Button Count
	const newButton = interaction.message.components[0].components[0].setLabel(`🍷 ${entries}`);
	const row = new MessageActionRow();
	row.addComponents(newButton);
	await interaction.update({ components: [row] });
	await interaction.followUp({ content: 'You have successfully joined the giveaway!', ephemeral: true });
}

function addEntries(interaction, roles) {
	// Check for Multiplier
	const multiplierField = interaction.message.embeds[0].fields.find(field => field.name.includes('Multipliers'));
	
	// Collect Participant's info
	const messageId = interaction.message.id;
	const { id, username, discriminator } = interaction.user;
	const participant = { giveawayId: messageId, discordId: id, username, discriminator };
	
	if (!multiplierField) {
		participants.push(participant);
		entries++;
		return;
	}

	let multiplier;

	if (roles.get(hangar.roles.aircraftEngineers)) multiplier = 2;
	if (roles.get(hangar.roles.core)) multiplier = 3;
	if (roles.get(hangar.roles.head)) multiplier = 4;
	
	for (let i = 0; i < multiplier; i++) {
		participants.push(participant);
	}
	entries++;
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
		const duplicate = winners.find(winner => winner.discordId === users[random].discordId);
		if (!duplicate) winners.push(users[random]);
		sentinel++;
	}
	return winners;
}

module.exports = { saveGiveaway, startGiveaway, enterGiveaway, scheduleGiveaway };