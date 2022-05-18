import { getBidHistory } from "../../database/auction-db.js";
import { convertTimestampToDate } from "../../handlers/date-handler.js";

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

export const auctionLogsEmbed = (embed, message, auctionDetails) => {
	embed.description = `An auction has started. Go to this auction by [clicking here.](${message.url})`;
	embed.footer = { text: `${auctionDetails.auction_id}` };
	embed.timestamp = new Date();
	embed.fields.forEach(field => {
		if (field.name === '_ _\nDuration') field.name = '_ _\nTime';
	});
	embed.fields.splice(2, 4);

	return embed;
};

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

export const updateBidHistoryField = (auctionId, embed, callback) => {
	let historyFields;

	// Get Bid History and Put it in a String
	getBidHistory(auctionId, bidHistory => {
		let firstFiveHistory; 
		let lastFiveHistory = '';

		// Get First Five
		bidHistory.forEach((bidder, index) => {
			const { discord_id, bid } = bidder;
			if (index === 0) firstFiveHistory = `**<@${discord_id}> - ${bid}**\n`;
			else if (index !== 0 && index <= 5) firstFiveHistory += `<@${discord_id}> - ${bid}\n`;
			else if (index > 5) lastFiveHistory += `<@${discord_id}> - ${bid}\n`;
		});

		historyFields = [
			{
				name: '_ _\nBid History',
				value: `${firstFiveHistory}`,
				inline: true,
			},
		];
		
		if (lastFiveHistory !== '') {
			const lastFiveField = {
				name: '_ _\n_ _\n',
				value: `${lastFiveHistory}`,
				inline: true,
			};
			historyFields.push(lastFiveField);
		}

		embed.fields.push(historyFields);
		callback(embed);
	});
}