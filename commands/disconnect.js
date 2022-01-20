const { SlashCommandBuilder } = require('@discordjs/builders');
const { getVoiceConnection } = require('@discordjs/voice');
const { MessageEmbed } = require('discord.js');
const { clearQueue, stopLoop } = require('../src/queue-system');
const { editEmbed } = require('../src/utils/embeds');
const { userNotConntected, botNotConnected } = require('../src/utils/not-connected');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('disconnect')
		.setDescription('Disconnects from the voice channel.'),
	async execute(interaction) {
		const connection = getVoiceConnection(interaction.guild.id);
		if (userNotConntected(interaction)) return;
		if (botNotConnected(interaction, connection)) return;

		clearQueue(interaction.guild.id);
		stopLoop(interaction.guild.id);
		connection.destroy();

		const embed = new MessageEmbed();
		editEmbed.disconnect(embed, interaction);
		await interaction.reply({ embeds: [embed] });
	},
};