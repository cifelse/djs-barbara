import ms from "ms";
import { addAuctionEntry, checkMiles, updateEndTime } from "../database/auction-db.js";
import { convertDateToTimestamp } from "./date-handler.js";

export const modalHandler = async (client, modal) => {
	if (modal.customId === 'bid') {
		// Get necessary data
		await modal.deferReply({ ephemeral: true });
        const user = modal.user;
		const auctionId = modal.message.id;
		let bid = modal.getTextInputValue('bid-input');

		// If the response is valid
		if (/^\d+$/.test(bid)) {
			bid = parseInt(bid);
			if (bid % 50 !== 0) {
				await modal.followUp({ content: `Invalid Input. Next Bids should be by 50s (ex. 200, 250, 300, 350, 400, ...)`, ephemeral: true });
				return;
			}
			// Check if Bid is Greater than current bid
			const embed = modal.message.embeds[0];
			let value, invalidAmount;
			embed.fields.forEach(field => {
				if (field.name === '_ _\nMinimum Bid') {
					value = field.value.replace(/[^\d]+/gi, '');
					if (bid < parseInt(value)) invalidAmount = true;
				}
				if (field.name === '_ _\nBid') {
					// Get Current Bid Value
					value = field.value.replace(/[^\d]+/gi, '');
					// Check Amount if Less than Current Bid Value
					if (bid <= parseInt(value)) invalidAmount = true;
				}
			});
			if (invalidAmount) {
				await modal.followUp({ content: `Bid should be more than ${value} MILES.`, ephemeral: true });
				return;
			}

			checkMiles(user.id, async userData => {
				let fields, spliceValue;

				if (userData.miles < bid) {
					await modal.followUp({ content: `You do not have enough to bid ${bid} MILES.`, ephemeral: true });
					return;
				}

				// Get Necessary data for auction
				const auction = client.auctionSchedules.find(auction => auction.title === embed.title);
				const endDate = Date.parse(auction.endDate);
				const dateDifference = Math.abs(endDate - Date.now());
				const minutes = Math.round(dateDifference / 60000);

				// Reschedule Bidding if duration is less than or equal 10 minutes
				if (minutes <= 10) {
					let newEndDate = new Date(endDate + ms('10m'));
					auction.endDate = newEndDate;
					auction.reschedule(newEndDate);
					
					const timestampEndDate = convertDateToTimestamp(newEndDate);
					updateEndTime(auctionId, timestampEndDate);
					// Set New Bidder in Embed
					spliceValue = 0;
					fields = [
						{
							name: '_ _\nDuration',
							value: `<t:${Math.floor(newEndDate.getTime() / 1000)}:R>`,
							inline: true,
						},
						{
							name: '_ _\nHighest Bidder',
							value: `${modal.user}`,
							inline: true,
						},
						{
							name: '_ _\nBid',
							value: `${bid} MILES`,
							inline: true,
						},
					];
				}
				else {
					spliceValue = 1;
					fields = [
						{
							name: '_ _\nHighest Bidder',
							value: `${modal.user}`,
							inline: true,
						},
						{
							name: '_ _\nBid',
							value: `${bid} MILES`,
							inline: true,
						},
					];
				}

				// Update Bid Message
				embed.fields.splice(spliceValue, embed.fields.length, fields);
				await modal.message.edit({ embeds: [embed] });
				addAuctionEntry(auctionId, user.id, bid);
				await modal.followUp({ content: `You have successfully bidded ${bid} MILES.`, ephemeral: true });
			});
		}
		// If the response is invalid
		else {
			await modal.followUp({ content: 'You entered an invalid amount.', ephemeral: true });
		}
    }
}