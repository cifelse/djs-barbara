const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { editEmbed } = require('../src/utils/embeds');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('View Barbara\'s commands.'),
	async execute(interaction) {
		const embed = new MessageEmbed();
		editEmbed.help(embed, interaction);
		await interaction.followUp({ embeds: [embed] });
	},
};