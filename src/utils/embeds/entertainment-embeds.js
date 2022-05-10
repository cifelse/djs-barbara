import { MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import { getBidHistory } from "../../database/auction-db.js";
import { convertTimestampToDate } from "../../handlers/date-handler.js";
import { keys } from "../keys.js";
const { roles: { admin, ram, levels }, channels: { giveaway, lottery, logs: { giveawayLogs, lotteryLogs } } } = keys.concorde;

// Giveaway Embeds
export const giveawayEmbed = (interaction, giveawayDetails) => {
	const giveawayEmbed = new MessageEmbed();
	const scheduledEndDate = convertTimestampToDate(giveawayDetails.end_date);
	const ffa = giveawayDetails.ffa;
	const multiplier = giveawayDetails.multiplier;

	giveawayEmbed.setColor('#80A3FF')
	.setTitle(giveawayDetails.title)
	.setAuthor({ name: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL()}` })
	.setDescription('You know what it is, **Click** 🍷 **to enter the giveaway!**\n')
	.addFields(
		{ name: '_ _\nDuration', value: `<t:${Math.floor(scheduledEndDate.getTime() / 1000)}:R>`, inline: true },
		{ name: '_ _\nWinner/s', value: `${giveawayDetails.num_winners}`, inline: true },
	);

	if (ffa) giveawayEmbed.addField('_ _\nRequirement', 'Free for All');
	else giveawayEmbed.addField('_ _\nRequirement', `At least be <@&${levels.frequentFlyers}> (Level 10)`);

	if (multiplier) giveawayEmbed.addField('_ _\nMultipliers', `<@&${levels.jetsetters}> + 4\n<@&${levels.businessClass}> + 3\n<@&${levels.premiumEconomy}> + 2`);
	
	return giveawayEmbed;
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

// Lottery Embeds
export const lotteryEmbed = (interaction, lotteryDetails) => {
	const lotteryEmbed = new MessageEmbed();
	const scheduledEndDate = convertTimestampToDate(lotteryDetails.end_date);
	const ffa = lotteryDetails.ffa;
	lotteryEmbed.setColor('#80A3FF')
	.setTitle(lotteryDetails.title)
	.setAuthor({ name: `${interaction.user.username}#${interaction.user.discriminator}`, iconURL: `${interaction.user.displayAvatarURL()}` })
	.setDescription('**You can now use your MILES to enter the lotteries in Concorde!** Unlike the Auctions, everyone is able to win the Whitelist Spots fairly.\n\n **Click 🎫 to enter the lottery!**')
	.addFields(
		{ name: '_ _\nDuration', value: `<t:${Math.floor(scheduledEndDate.getTime() / 1000)}:R>`, inline: true },
		{ name: '_ _\nWinner/s', value: `${lotteryDetails.num_winners}`, inline: true },
		{ name: '_ _\nMax Tickets', value: `${lotteryDetails.max_tickets}`, inline: true },
		{ name: '_ _\nPrice of a Single Ticket', value: `For this lottery, a single ticket costs **${lotteryDetails.price} MILES.**`, inline: false },
	);

	if (ffa) lotteryEmbed.addField('_ _\nRequirement', 'Free for All');
	else lotteryEmbed.addField('_ _\nRequirement', `At least be <@&${levels.frequentFlyers}> (Level 10)`);
	
	return lotteryEmbed;
}

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

	// Announce Winners
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

// Auction Embeds
export const auctionEmbed = (details) => {
	const scheduledEndDate = convertTimestampToDate(details.end_date);
	return {
		title: `${details.title}`,
		description: '**You may now use MILES to gain whitelist spots** from projects you have been eyeing for a long time that happens to be Partners of Concorde also! Bid by pressing the Bid button below.',
		fields: [
			{
				name: '_ _\nDuration',
				value: `<t:${Math.floor(scheduledEndDate.getTime() / 1000)}:R>`,
				inline: true,
			},
			{
				name: '_ _\nMinimum Bid',
				value: `${details.minimum_bid}`,
				inline: true,
			},
		],
		color: 'f1f10b',
	};
}

export const updateAuctionEmbed = (user, bid, endDate) => {
	let fields;

	if (!endDate) {
		fields = [
			{
				name: '_ _\nHighest Bidder',
				value: `${user}`,
				inline: true,
			},
			{
				name: '_ _\nBid',
				value: `${bid} MILES`,
				inline: true,
			},
		];
		return fields;
	}
	fields = [
		{
			name: '_ _\nDuration',
			value: `<t:${Math.floor(endDate.getTime() / 1000)}:R>`,
			inline: true,
		},
		{
			name: '_ _\nHighest Bidder',
			value: `${user}`,
			inline: true,
		},
		{
			name: '_ _\nBid',
			value: `${bid} MILES`,
			inline: true,
		},
	];

	return fields;
};

export const updateBidHistoryField = (auctionId, embed) => {
	let historyFields;

	// Get Bid History and Put it in a String
	getBidHistory(auctionId, bidHistory => {
		let firstFiveHistory, lastFiveHistory;

		// Get First Five
		bidHistory.forEach((bidder, index) => {
			const { discord_id, bid } = bidder;
			if (index === 0) firstFiveHistory += `**<@${discord_id}> - ${bid}**\n`;
			else if (index !== 0 && index <= 5) firstFiveHistory += `<@${discord_id}> - ${bid}\n`;
			else if (index > 5) lastFiveHistory += `<@${discord_id}> - ${bid}\n`;
		});

		historyFields = [
			{
				name: '_ _\nLast 10 Bid History',
				value: `${firstFiveHistory}`,
				inline: true,
			},
		];

		if (!lastFiveHistory) return embed.fields.push(historyFields); 

		const lastFiveField = {
			name: '_ _\n_ _\n',
			value: `${lastFiveHistory}`,
			inline: true,
		};

		historyFields.push(lastFiveField);
		console.log(embed);
		return embed.fields.push(historyFields);
	});
}