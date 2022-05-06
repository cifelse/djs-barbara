import { MessageEmbed } from 'discord.js';
import { userNotConnected as userNotConnectedEmbed, botNotConnected as botNotConnectedEmbed } from './embeds/player-embeds.js';

export const userNotConnected = async (interaction) => {
	const voiceChannel = interaction.member.voice.channel;
	if (!voiceChannel) {
		const embed = new MessageEmbed();
		userNotConnectedEmbed(embed);
		await interaction.reply({ embeds: [embed] });
		return true;
	}
	return false;
}

export const botNotConnected = async (interaction, connection) => {
	if (!connection) {
		const embed = new MessageEmbed();
		botNotConnectedEmbed(embed);
		await interaction.reply({ embeds: [embed] });
		return true;
	}
	return false;
}