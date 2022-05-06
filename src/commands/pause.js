import { MessageEmbed } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { getVoiceConnection } from '@discordjs/voice';
import { botNotConnected, userNotConnected } from '../utils/not-connected.js';
import { pause } from '../utils/embeds/player-embeds.js';

export const data = new SlashCommandBuilder()
	.setName('pause')
	.setDescription('Pauses song from playing.');

export const execute = async (interaction) => {
	const connection = getVoiceConnection(interaction.guild.id);
	
	if (await userNotConnected(interaction)) return;
	if (await botNotConnected(interaction, connection)) return;

	const player = connection.state.subscription.player;
	player.pause();

	const embed = new MessageEmbed();
	pause(embed, interaction);
	await interaction.reply({ embeds: [embed] });
}