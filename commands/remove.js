const { SlashCommandBuilder } = require('@discordjs/builders');
const { getVoiceConnection } = require('@discordjs/voice');
const { MessageEmbed } = require('discord.js');
const { editEmbed } = require('../src/utils/embeds');
const { userNotConntected, botNotConnected } = require('../src/utils/not-connected');
const { removeSong } = require('../src/queue-system');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('remove')
		.setDescription('Removes a song from queue.')
		.addStringOption(option => option.setName('position')
			.setDescription('Input position of the song you want to remove.')
			.setRequired(true)),
	async execute(interaction) {
		const connection = getVoiceConnection(interaction.guild.id);
		if (userNotConntected(interaction)) return;
		if (botNotConnected(interaction, connection)) return;

		let position = interaction.options.getString('position');
		position = parseInt(position) - 1;
		const song = removeSong(interaction.guild.id, position);

		const embed = new MessageEmbed();
		editEmbed.removeSong(embed, song);
		await interaction.reply({ embeds: [embed] });
	},
};