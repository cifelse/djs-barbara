import { MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import { convertTimestampToDate } from "../../handlers/date-handler.js";
import { keys } from "../keys.js";
const { roles: { admin, levels }, channels: { logs: { lotteryLogs } } } = keys.concorde;

// Lottery Embeds
export const lotteryEmbed = (interaction, lotteryDetails) => {
	const scheduledEndDate = convertTimestampToDate(lotteryDetails.end_date);
	const ffa = lotteryDetails.ffa;

	const embed = {
		title: lotteryDetails.title,
		color: '#80A3FF',
		author: {
			name: interaction.user.tag,
			icon_url: interaction.user.displayAvatarURL(),
		},
		description: '**You can now use your MILES to enter the lotteries in Concorde!** Unlike the Auctions, everyone is able to win the Whitelist Spots fairly.\n\n **Click 🎫 to enter the lottery!**',
		fields: [
			{ name: '_ _\nDuration', value: `<t:${Math.floor(scheduledEndDate.getTime() / 1000)}:R>`, inline: true },
			{ name: '_ _\nWinner/s', value: `${lotteryDetails.num_winners}`, inline: true },
			{ name: '_ _\nMax Tickets', value: `${lotteryDetails.max_tickets}`, inline: true },
			{ name: '_ _\nPrice of a Single Ticket', value: `For this lottery, a single ticket costs **${lotteryDetails.price} MILES.**`, inline: false },
		],
	}

	const ffaField = { name: '_ _\nRequirement', value: 'Free for All' };
	const frequentFlyersField = { name: '_ _\nRequirement', value: `At least be <@&${levels.frequentFlyers}> (Level 10)` };

	if (ffa) embed.fields.push(ffaField);
	else embed.fields.push(frequentFlyersField);
	
	return embed;
}

export const lotteryLogsEmbed = (embed, lotteryMessage, lotteryDetails) => {
	embed.description = `A lottery has started. Go to this lottery by [clicking here.](${lotteryMessage.url})`;
	embed.fields.push({ name: '_ _\nChannel', value: `<#${lotteryDetails.channel_id}>` });
	embed.footer = ({ text: `${lotteryDetails.lottery_id}` });
	embed.timestamp = new Date();
	embed.fields.forEach(field => {
		if (field.name === '_ _\nDuration') field.name = '_ _\nTime';
	});

	return embed;
};

export const announceLotteryWinners = async (channel, message, winners, title) => {
	// Edit Embed of Lottery Message
	const editedEmbed = message.embeds[0];
	editedEmbed.setColor('RED');
	editedEmbed.setFooter({ text: `${message.id}` });
	editedEmbed.setTimestamp();
	editedEmbed.spliceFields(0, editedEmbed.fields.length, [
		{ name: '_ _\nEnded', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }, 
		{ name: '_ _\nWinner/s', value: `${winners}`, inline: true },
	]);

	// Edit Description, Disable Button and Announce Winners
	if (winners === 'None') {
		editedEmbed.setDescription('**Lottery has ended.** Sadly, no one joined the lottery so no one won. 😢');
		message.edit({ embeds:[editedEmbed], components: [] });
		return;
	}

	editedEmbed.setDescription('Oh honey, I would like to extend but we need to end at some point. **Congratulations to the winner/s!** 🎉 Make sure to register a passport over at <#915156513339891722> or else I\'ll have to disqualify you. 😉');
	const disabledButton = message.components[0].components[0];
	disabledButton.setDisabled(true);
	const newRow = new MessageActionRow();
	newRow.addComponents(disabledButton);

	// Send Winner Message
	await message.edit({ embeds:[editedEmbed], components: [newRow] });
	await channel.send(`Congratulations to ${winners}for winning **"${title}"** 🎉\n\n**Important Note:**\nMake sure to register a passport. Just in case you haven't, you can do that at <#915156513339891722>. *Failure to do so will disqualify you from this lottery.*`);
}

export const editLotteryLog = async (client, lottery, message, winners) => {
	const { title, channel_id, lottery_id } = lottery;
	
	// Edit Lottery logs message
	const logsChannel = client.channels.cache.get(lotteryLogs);
	let logMessage;
	if (logsChannel) {
		const logMessages = await logsChannel.messages.fetch({ limit: 20 });
		logMessages.forEach(fetchedMessage => {
			if (!fetchedMessage.embeds[0] || !fetchedMessage.embeds[0].footer) return;
			if (fetchedMessage.embeds[0].footer.text === lottery_id) logMessage = fetchedMessage;
		});
	}

	// Create Reroll Button
	const row = new MessageActionRow();
	const rerollButton = new MessageButton()
		.setCustomId('reroll-lottery')
		.setLabel('Reroll')
		.setStyle('DANGER');
	row.addComponents(rerollButton);

	// Edit Embed
	const newEmbed = new MessageEmbed();
	newEmbed.setTitle(`${title}`);
	newEmbed.setColor('RED');
	newEmbed.setDescription(`Lottery has ended. Go to this lottery by [clicking here.](${message.url})`);
	newEmbed.setFooter({ text: `${lottery_id}` });
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