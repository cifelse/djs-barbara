const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { editEmbed } = require('../src/utils/embeds');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('check')
		.setDescription('Check if you are eligible to use Concorde Cafe.'),
	async execute(interaction) {
		const embed = new MessageEmbed();
		editEmbed.eligible(embed, interaction);
		await interaction.followUp({ embeds: [embed] });
	},
};

