import { SlashCommandBuilder } from '@discordjs/builders';
import { getVoiceConnection } from '@discordjs/voice';
import { MessageEmbed } from 'discord.js';
import { userNotConntected, botNotConnected } from '../src/utils/not-connected.js';
import { skip } from '../utils/embeds/player-embeds.js';

export const data = new SlashCommandBuilder()
	.setName('skip')
	.setDescription('Skips current track');

export const execute = async (interaction) => {
	const connection = getVoiceConnection(interaction.guild.id);

	if (await userNotConntected(interaction)) return;
	if (await botNotConnected(interaction, connection)) return;

	const player = connection.state.subscription.player;
	player.stop();

	const embed = new MessageEmbed();
	skip(embed, interaction);
	await interaction.reply({ embeds: [embed] });
}