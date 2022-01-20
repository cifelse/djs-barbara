const { SlashCommandBuilder } = require('@discordjs/builders');
const { getVoiceConnection } = require('@discordjs/voice');
const { MessageEmbed } = require('discord.js');
const { editEmbed } = require('../src/utils/embeds');
const { userNotConntected, botNotConnected } = require('../src/utils/not-connected');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Skips current track'),
	async execute(interaction) {
		const connection = getVoiceConnection(interaction.guild.id);
		if (userNotConntected(interaction)) return;
		if (botNotConnected(interaction, connection)) return;
		
		const player = connection.state.subscription.player;
		player.stop();

		const embed = new MessageEmbed();
		editEmbed.skip(embed, interaction);
		await interaction.reply({ embeds: [embed] });
	},
};