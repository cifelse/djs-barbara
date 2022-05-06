import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';
import { help } from '../utils/embeds/player-embeds.js';

export const data = new SlashCommandBuilder()
	.setName('help')
	.setDescription('View commands.');

export const execute = async (interaction) => {
	const embed = new MessageEmbed();
	help(embed, interaction);
	await interaction.reply({ embeds: [embed] });
}