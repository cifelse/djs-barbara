import { SlashCommandBuilder } from '@discordjs/builders';
import { getVoiceConnection } from '@discordjs/voice';
import { botNotConnected, userNotConnected } from '../utils/not-connected.js';
import { getNowPlaying } from '../utils/player/queue-system.js';

export const data = new SlashCommandBuilder()
	.setName('np')
	.setDescription('Show currently playing song.');

export const execute = async (interaction) => {
	const guild = interaction.guild.id;
	const connection = getVoiceConnection(guild);

	if (await userNotConnected(interaction)) return;
	if (await botNotConnected(interaction, connection)) return;

	await getNowPlaying(interaction, guild);
}