import { MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import { convertTimestampToDate } from "../../handlers/date-handler.js";
import { keys } from "../keys.js";
const { roles: { admin, levels }, channels: { logs: { giveawayLogs } } } = keys.concorde;

// Giveaway Embeds
export const giveawayEmbed = (interaction, giveawayDetails) => {
	const scheduledEndDate = convertTimestampToDate(giveawayDetails.end_date);
	const ffa = giveawayDetails.ffa;
	const multiplier = giveawayDetails.multiplier;

	const embed = {
		title: giveawayDetails.title,
		color: '#80A3FF',
		author: {
			name: interaction.user.tag,
			icon_url: interaction.user.displayAvatarURL(),
		},
		description: 'You know what it is, **Click** 🍷 **to enter the giveaway!**\n',
		fields: [
			{ name: '_ _\nDuration', value: `<t:${Math.floor(scheduledEndDate.getTime() / 1000)}:R>`, inline: true },
			{ name: '_ _\nWinner/s', value: `${giveawayDetails.num_winners}`, inline: true },
		],
	}

	const ffaField = { name: '_ _\nRequirement', value: 'Free for All' };
	const frequentFlyersField = { name: '_ _\nRequirement', value: `At least be <@&${levels.frequentFlyers}> (Level 10)` };
	const multiplierField = { name: '_ _\nMultipliers', value: `<@&${levels.jetsetters}> + 4\n<@&${levels.businessClass}> + 3\n<@&${levels.premiumEconomy}> + 2` };
	
	if (ffa) embed.fields.push(ffaField);
	else embed.fields.push(frequentFlyersField);

	if (multiplier) embed.fields.push(multiplierField);
	
	return embed;
}

export const giveawayLogsEmbed = (embed, giveawayMessage, giveawayDetails) => {
	embed.description = `A giveaway has started. Go to this giveaway by [clicking here.](${giveawayMessage.url})`;
	embed.fields.push({ name: '_ _\nChannel', value: `<#${giveawayDetails.channel_id}>` })
	embed.footer = { text: `${giveawayDetails.giveaway_id}` }
	embed.timestamp = new Date();
	embed.fields.forEach(field => {
		if (field.name === '_ _\nDuration') field.name = '_ _\nTime';
	});

	return embed;
}

export const announceGiveawayWinners = async (channel, message, winners, title) => {
	// Edit Embed of Giveaway Message
	const editedEmbed = message.embeds[0];
	editedEmbed.setColor('RED');
	editedEmbed.setFooter({ text: `${message.id}` });
	editedEmbed.setTimestamp();
	editedEmbed.spliceFields(0, editedEmbed.fields.length, [
		{ name: '_ _\nEnded', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }, 
		{ name: '_ _\nWinner/s', value: `${winners}`, inline: true },
	]);

	// Announce Winners
	if (winners === 'None') {
		editedEmbed.setDescription('**Giveaway has ended.** Sadly, no one joined the giveaway so no one won. 😢');
		await message.edit({ embeds:[editedEmbed], components: [] });
		return;
	}

	editedEmbed.setDescription('Oh honey, I would like to extend but we need to end at some point. **Congratulations to the winner/s!** 🎉 Make sure to register a passport over at <#915156513339891722> or else I\'ll have to disqualify you. 😉');
	const disabledButton = message.components[0].components[0];
	disabledButton.setDisabled(true);
	const newRow = new MessageActionRow();
	newRow.addComponents(disabledButton);

	// Send Winner Message
	await message.edit({ embeds:[editedEmbed], components: [newRow] });
	await channel.send(`Congratulations to ${winners}for winning **"${title}"** 🎉\n\n**Important Note:**\nMake sure to register a passport. Just in case you haven't, you can do that at <#915156513339891722>. *Failure to do so will disqualify you from this giveaway.*`);
}

export const editGiveawayLog = async (client, giveaway, message, winners) => {
	const { title, channel_id, giveaway_id } = giveaway;

	// Edit Giveaway log message
	const logsChannel = client.channels.cache.get(giveawayLogs);
	let logMessage;
	if (logsChannel) {
		const logMessages = await logsChannel.messages.fetch({ limit: 20 });
		logMessages.forEach(fetchedMessage => {
			if (!fetchedMessage.embeds[0] || !fetchedMessage.embeds[0].footer) return;
			if (fetchedMessage.embeds[0].footer.text === giveaway_id) logMessage = fetchedMessage;
		});
	}

	// Create Reroll Button
	const row = new MessageActionRow();
	const rerollButton = new MessageButton()
		.setCustomId('reroll-giveaway')
		.setLabel('Reroll')
		.setStyle('DANGER');
	row.addComponents(rerollButton);

	// Edit Embed
	const newEmbed = new MessageEmbed();
	newEmbed.setTitle(`${title}`);
	newEmbed.setColor('RED');
	newEmbed.setDescription(`Giveaway has ended. Go to this giveaway by [clicking here.](${message.url})`);
	newEmbed.setFooter({ text: `${giveaway_id}` });
	newEmbed.setTimestamp();
	newEmbed.spliceFields(0, newEmbed.fields.length, [
		{ name: '_ _\nEnded', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }, 
		{ name: '_ _\nChannel', value: `<#${channel_id}>`, inline: true },
		{ name: '_ _\nWinner/s', value: `${winners}`, inline: false },
		{ name: '_ _\nReroll Reminder', value: `Only the <@&${admin.captain}> and the <@&${admin.crew}> can use the Reroll Button.\n\nFor additional protection, **the Reroll Button will be disabled after 24 hours.**`, inline: false },
	]);
	
	if (winners === 'None') {
		rerollButton.setDisabled(true);
	}

	// If there are winners
	const newRow = new MessageActionRow();
	newRow.addComponents(rerollButton);
	await logMessage.edit({ embeds:[newEmbed], components: [newRow] });
}