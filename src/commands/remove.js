import { SlashCommandBuilder } from '@discordjs/builders';
import { getVoiceConnection } from '@discordjs/voice';
import { MessageEmbed } from 'discord.js';
import { botNotConnected, userNotConnected } from '../utils/not-connected.js';
import { removeSong } from '../utils/player/queue-system.js';
import { removeSong as removeSongEmbed } from '../utils/embeds/player-embeds.js';

export const data = new SlashCommandBuilder()
	.setName('remove')
	.setDescription('Removes a song from queue.')
	.addStringOption(option => option.setName('position')
		.setDescription('Input position of the song you want to remove.')
		.setRequired(true));

export const execute = (interaction) => {
	const connection = getVoiceConnection(interaction.guild.id);
	
	if (await userNotConnected(interaction)) return;
	if (await botNotConnected(interaction, connection)) return;

	let position = interaction.options.getString('position');
	position = parseInt(position) - 1;
	const song = removeSong(interaction.guild.id, position);

	const embed = new MessageEmbed();
	removeSongEmbed(embed, song);
	await interaction.reply({ embeds: [embed] });
}