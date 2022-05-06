import { SlashCommandBuilder } from '@discordjs/builders';
import { getVoiceConnection } from '@discordjs/voice';
import { userNotConnected, botNotConnected } from '../utils/player/not-connected.js'
import { loopQueue } from '../utils/player/queue-system.js';

export const data = new SlashCommandBuilder()
	.setName('loop')
	.setDescription('Loops the queue');

export const execute = async (interaction) => {
	const connection = getVoiceConnection(interaction.guild.id);
	
	if (await userNotConnected(interaction)) return;
	if (await botNotConnected(interaction, connection)) return;

	await loopQueue(interaction);
}