import { MessageButton, MessageActionRow } from 'discord.js';
import { saveAuction, getAuctions, insertAuctionWinner, payMiles, getWinners } from '../database/auction-db.js';
import { auctionEmbed } from '../utils/embeds/entertainment-embeds.js';
import { scheduleJob } from 'node-schedule';
import { keys } from '../utils/keys.js';
import { updateMilesBurned } from '../database/db.js';

export const startAuction = async (interaction, details, client) => {
	// Create and Send Message Embed
	const embed = auctionEmbed(details);
	const row = new MessageActionRow();
	row.addComponents(
		new MessageButton()
			.setCustomId('bid')
			.setLabel('Bid')
			.setStyle('PRIMARY'),
	);
	await interaction.reply({ content: `Auction successfully launched for **"${details.title}"**!` });
	const channel = interaction.guild.channels.cache.get(details.channel_id);
	const message = await channel.send({ embeds: [embed], components: [row], fetchReply: true });

	details.auction_id = message.id;
	
	saveAuction(details, () => {
		getAuctions(auctions => {
			const lastItem = auctions[auctions.length - 1];
			scheduleAuction(client, [lastItem]);
		});
	});

	// Edit embed and send to Auction Logs
	embed.description = `An auction has started. Go to this auction by [clicking here.](${message.url})`;
	embed.footer = { text: `${details.auction_id}` };
	embed.timestamp = new Date();
	embed.fields.forEach(field => {
		if (field.name === '_ _\nDuration') field.name = '_ _\nTime';
	});
	embed.fields.splice(2, 4);
	const logsChannel = interaction.guild.channels.cache.get(keys.concorde.channels.logs.auctionLogs);
	await logsChannel.send({ embeds: [embed] });
}

export const scheduleAuction = async (client, details) => {
	// Get Details of Auctions
	for (let i = 0; i < details.length; i++) {
		const { auction_id, title, num_winners, end_date, channel_id } = details[i];

		const currentDate = new Date().getTime();

		if (end_date.getTime() < currentDate) continue;

		console.log('Barbara: Alert! I\'m Scheduling an Auction for', title);
		
		const schedule = scheduleJob(end_date, async () => {
			// Get Channel and Message
			let message;
			const channel = await client.channels.fetch(channel_id);
			if (channel) message = await channel.messages.fetch(auction_id);

			// Edit Embed
			const embed = message.embeds[0];
			embed.color = 'RED';
			const button = message.components[0].components[0];
			button.setDisabled(true);
			const newRow = new MessageActionRow();
			newRow.addComponents(button);
			message.edit({ embeds: [embed], components: [newRow] });

			// Get Auction and announce winner
			getWinners(auction_id, num_winners, async winners => {
				if (!winners[0]) {
					await channel.send(`Auction for **"${title}"** has ended. Unfortunately, no one bidded in this Auction hence no winners.`);
					return;
				}
				// Put winners in string
				let winnerString = ''

				winners.forEach(winner => {
					winnerString += `<@${winner.discord_id}> `;
					payMiles(winner.discord_id, winner.bid);
					updateMilesBurned(winner.bid, 'auctions');
					insertAuctionWinner(auction_id, winner.discord_id, winner.bid);
				});

				await channel.send(`Auction for **"${title}"** has ended and has been won by <@${winnerString}>`);
			});
			
		});

		// Get title and end date for Rescheduling Bidding in Index
		schedule.title = title;
		schedule.endDate = end_date;
		client.auctionSchedules.push(schedule);
	}
}