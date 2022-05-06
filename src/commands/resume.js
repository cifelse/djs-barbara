import { SlashCommandBuilder } from '@discordjs/builders';
import { getVoiceConnection } from '@discordjs/voice';
import { MessageEmbed } from 'discord.js';
import { resume } from '../utils/embeds/player-embeds.js';
import { botNotConnected, userNotConnected } from '../utils/not-connected.js';

export const data = new SlashCommandBuilder()
	.setName('resume')
	.setDescription('Resumes the music.');

export const execute = async (interaction) => {
	const connection = getVoiceConnection(interaction.guild.id);

	if (await userNotConnected(interaction)) return;
	if (await botNotConnected(interaction, connection)) return;

	const player = connection.state.subscription.player;
	player.unpause();

	const embed = new MessageEmbed();
	resume(embed, interaction);
	await interaction.reply({ embeds: [embed] });
}