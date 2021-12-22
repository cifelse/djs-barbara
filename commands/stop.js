const { SlashCommandBuilder } = require('@discordjs/builders');
const { getVoiceConnection } = require('@discordjs/voice');
const { MessageEmbed } = require('discord.js');
const { clearQueue } = require('../src/queue-system');
const { editEmbed } = require('../src/utils/embeds');
const { userNotConntected, botNotConnected } = require('../src/utils/not-connected');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stop')
		.setDescription('Stops the queue.'),
	async execute(interaction) {
		if (userNotConntected(interaction)) return;
		
		const guild = interaction.guild.id;
		const connection = getVoiceConnection(guild);
		if (botNotConnected(interaction, connection)) return;
		
		clearQueue(guild);
		const player = connection.state.subscription.player;
		player.stop();

		const embed = new MessageEmbed();
		editEmbed.clear(embed, interaction);
		await interaction.followUp({ embeds: [embed] });
	},
};