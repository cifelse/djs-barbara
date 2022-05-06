import { SlashCommandBuilder } from '@discordjs/builders';
import { getVoiceConnection } from '@discordjs/voice';
import { MessageEmbed } from 'discord.js';
import { disconnect } from '../utils/embeds/player-embeds.js';
import { userNotConnected, botNotConnected } from '../utils/player/not-connected.js'
import { clearQueue, stopLoop } from '../utils/player/queue-system.js';

export const data = new SlashCommandBuilder()
	.setName('disconnect')
	.setDescription('Disconnects from the voice channel.');

export const execute = async (interaction) => {
	const connection = getVoiceConnection(interaction.guild.id);
	
	if (await userNotConnected(interaction)) return;
	if (await botNotConnected(interaction, connection)) return;

	clearQueue(interaction.guild.id);
	stopLoop(interaction.guild.id);
	connection.destroy();

	const embed = new MessageEmbed();
	disconnect(embed, interaction);
	await interaction.reply({ embeds: [embed] });
}