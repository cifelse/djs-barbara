const { MessageButton, MessageActionRow } = require('discord.js');
const { saveAuction, getAuction } = require('../database/auction-db');
const { editEmbed } = require('./embeds');
const { hangar, concorde } = require('./ids.json');
const { scheduleJob } = require('node-schedule');

async function startAuction(interaction, details, client) {
	const embed = editEmbed.auctionEmbed(details);
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
	details.start_date = new Date().toString();
	
	saveAuction(details);
	scheduleAuction(client, [details]);

	// Send A Copy on Server Logs
	embed.description = `An auction has started. Go to this auction by [clicking here.](${message.url})`;
	embed.footer = { text: `${details.auction_id}` };
	embed.timestamp = new Date();
	embed.fields.forEach(field => {
		if (field.name === '_ _\nDuration') field.name = '_ _\nTime';
	});
	embed.fields.splice(2, 4);
	const logsChannel = interaction.guild.channels.cache.get(concorde.channels.auctionLogs);
	await logsChannel.send({ embeds: [embed] });
}

async function scheduleAuction(client, details) {
	// Get Details of Auctions
	for (let i = 0; i < details.length; i++) {
		const currentDate = new Date().getTime();
		const endDate = Date.parse(details[i].end_date);

		if (endDate < currentDate) continue;

		const { auction_id, title, end_date, channel_id } = details[i];
		console.log('Barbara: Alert! I\'m Scheduling an Auction for', end_date);
		
		const channel = client.channels.cache.get(channel_id);
		let message;
		if (channel) message = await channel.messages.fetch(auction_id);
	
		const schedule = scheduleJob(end_date, () => {
			// Edit Embed
			const embed = message.embeds[0];
			embed.color = 'RED';
			const button = message.components[0].components[0];
			button.setDisabled(true);
			const newRow = new MessageActionRow();
			newRow.addComponents(button);
			message.edit({ embeds: [embed], components: [newRow] });
			// Get Auction and announce winner
			getAuction(auction_id, async auction => {
				// Get Auction and time
				auction = auction[0];
				const deadline = `<t:${Math.floor(Date.now() / 1000) + (360 * 60)}:R>`
				if (!auction) return;
				if (!auction.highest_bidder && !auction.bid) await channel.send(`Auction for **"${auction.title}"** has ended. Unfortunately, no one bidded in this Auction hence no winners.`);
				else await channel.send(`Auction for **"${auction.title}"** has ended and has been won by <@${auction.highest_bidder}> with a bid of ${auction.bid} MILES. You have until ${deadline} to pay your MILES to Concorde.\n\nPay your MILES by typing \`/pay-miles <MILES>\` over at the <#956165537820459008> channel.`);
			});
			
		});
		schedule.title = title;
		schedule.endDate = end_date;
		client.auctionSchedules.push(schedule);
	}
}

module.exports = {
	startAuction,
	scheduleAuction,
};