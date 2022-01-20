const { MessageEmbed } = require('discord.js');
const { editEmbed } = require('./embeds');

module.exports = {
	userNotConntected: interaction => {
		const voiceChannel = interaction.member.voice.channel;
		if (!voiceChannel) {
			const embed = new MessageEmbed();
			editEmbed.userNotConnected(embed);
			interaction.reply({ embeds: [embed] });
			return true;
		}
		return false;
	},
	botNotConnected: (interaction, connection) => {
		if (!connection) {
			const embed = new MessageEmbed();
			editEmbed.botNotConnected(embed);
			interaction.reply({ embeds: [embed] });
			return true;
		}
		return false;
	},
};