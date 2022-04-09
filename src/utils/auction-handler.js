const { MessageButton, MessageActionRow } = require('discord.js');
const { saveAuction } = require('../database/auction-db');
const { editEmbed } = require('./embeds');
const { hangar } = require('./ids.json');

async function startAuction(interaction, details, client) {
	const embed = editEmbed.auctionEmbed(interaction, details);
	const row = new MessageActionRow();
	row.addComponents(
		new MessageButton()
			.setCustomId('bid')
			.setLabel('Bid')
			.setStyle('PRIMARY'),
	);
	const channel = interaction.guild.channels.cache.get(hangar.channels.barbaraTest);
	const message = await channel.send({ embeds: [embed], components: [row], fetchReply: true });

	details.auctionId = message.id;
	details.startDate = new Date().toString();
	
	// saveAuction(details);
	// scheduleGiveaway(client, [details]);
	await interaction.reply({ content: `Auction successfully launched for **"${details.title}"**!` });

	// Send A Copy on Server Logs
	embed.description = `An auction has started. Go to this auction by [clicking here.](${message.url})`;
	embed.footer = { text: `${details.auctionId}` };
	embed.timestamp = new Date();
	embed.fields.forEach(field => {
		if (field.name === '_ _\nDuration') field.name = '_ _\nTime';
	});
	embed.fields.splice(2, 4);
	const logsChannel = interaction.guild.channels.cache.get(hangar.channels.barbaraLogs);
	await logsChannel.send({ embeds: [embed] });
}

module.exports = {
	startAuction,
};