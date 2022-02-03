const { MessageActionRow } = require('discord.js');
const { hangar } = require('./ids.json');

let participants = [];
let entries = 0;

function startGiveaway(embed, giveaway, interaction) {
	embed.setColor('#80A3FF')
		.setTitle(giveaway.title)
		.setAuthor({ name: `${interaction.user.username}#${interaction.user.discriminator}`, iconURL: `${interaction.user.displayAvatarURL()}` })
		.setDescription('You know what it is, **Click** 🍷 **to enter the giveaway!**\n')
		.addFields(
			{ name: '_ _\nDuration', value: `<t:${Math.floor(giveaway.endsOn.getTime() / 1000)}:R>`, inline: true },
			{ name: '_ _\nWinner/s', value: `${giveaway.winnerCount}`, inline: true },
		)
		.setFooter({ text: `${interaction.id}` })
		.setTimestamp();

		if (giveaway.all === 'on') embed.addField('_ _\nRequirement', 'Free for All');
		else embed.addField('_ _\nRequirement', 'At least <@&893745856719757332> (Level 5)');

		if (giveaway.multiplier === 'on') embed.addField('_ _\nMultipliers', `<@&${hangar.roles.head}> + 4\n<@&${hangar.roles.core}> + 3\n<@&${hangar.roles.aircraftEngineers}> + 2`);
}

async function enterGiveaway(interaction) {
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
	const duplicate = participants.find(participant => participant === interaction.user);
	if (duplicate) {
		await interaction.reply({ content: 'You already participated in this giveaway.', ephemeral: true });
		return;
	}
	// Add participants
	const roles = interaction.member.roles.cache;
	multiplyEntries(interaction, roles);
	entries++;
	
	const newButton = interaction.message.components[0].components[0].setLabel(`🍷 ${entries}`);
	const row = new MessageActionRow();
	row.addComponents(newButton);
	await interaction.update({ components: [row] });
	await interaction.followUp({ content: 'You have successfully joined the giveaway!', ephemeral: true });
}

function endGiveaway(interaction, message, details) {
	const winners = determineWinners(participants, details.winnerCount);
	participants = [];
	entries = 0;

	let winnerString = '';

	if (winners.size === 0) {
		winnerString = 'None';
	}
	else {
		winners.forEach(winner => {
			winnerString += `<@${winner.id}> `;
		});
	}
	
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
		interaction.channel.send(`Congratulations to ${winnerString}for winning **"${details.title}"** 🎉\n\n**Important Note:**\nMake sure to register a passport. Just in case you haven't, you can do that at <#915156513339891722>. *Failure to do so will disqualify you from this giveaway.*`);
	}
}

function multiplyEntries(interaction, roles) {
	let multiplier;

	if (roles.get(hangar.roles.aircraftEngineers)) multiplier = 2;
	if (roles.get(hangar.roles.core)) multiplier = 3;
	if (roles.get(hangar.roles.head)) multiplier = 4;

	for (let i = 0; i < multiplier; i++) {
		participants.push(interaction.user);
	}
}

function determineWinners(users, winnerCount) {
	const winners = new Set();
	let sentinel = 0;

	while (winners.size <= winnerCount && sentinel < users.length) {
		const random = Math.floor(Math.random() * users.length);
		winners.add(users[random]);
		sentinel++;
	}
	return winners;
}

module.exports = { startGiveaway, enterGiveaway, endGiveaway };