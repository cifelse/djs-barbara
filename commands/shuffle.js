const { SlashCommandBuilder } = require('@discordjs/builders');
const { getVoiceConnection } = require('@discordjs/voice');
const { MessageEmbed } = require('discord.js');
const { getQueue } = require('../src/queue-system');
const { editEmbed } = require('../src/utils/embeds');
const { userNotConntected, botNotConnected } = require('../src/utils/not-connected');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('shuffle')
		.setDescription('Shuffles the queue'),
	async execute(interaction) {
		const guild = interaction.guild.id;
		const connection = getVoiceConnection(guild);
		if (userNotConntected(interaction)) return;
		if (botNotConnected(interaction, connection)) return;

		const queue = getQueue(guild);

		for (let position = queue.songs.length - 1; position > 0; position--) {
			const newPosition = Math.floor(Math.random() * (position + 1));
			const placeholder = queue.songs[position];
			queue.songs[position] = queue.songs[newPosition];
			queue.songs[newPosition] = placeholder;
		}

		const embed = new MessageEmbed();
		editEmbed.shuffle(embed, interaction);
		await interaction.followUp({ embeds: [embed] });
	},
};