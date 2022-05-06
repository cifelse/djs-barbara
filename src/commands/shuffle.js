import { SlashCommandBuilder } from '@discordjs/builders';
import { getVoiceConnection } from '@discordjs/voice';
import { MessageEmbed } from 'discord.js';
import { shuffle } from '../utils/embeds/player-embeds.js';
import { userNotConnected, botNotConnected } from '../utils/player/not-connected.js'
import { getQueue } from '../utils/player/queue-system.js';

export const data = new SlashCommandBuilder()
	.setName('shuffle')
	.setDescription('Shuffles the queue');

export const execute = async (interaction) => {
	const guild = interaction.guild.id;
	const connection = getVoiceConnection(guild);

	if (await userNotConnected(interaction)) return;
	if (await botNotConnected(interaction, connection)) return;

	const queue = getQueue(guild);

	for (let position = queue.songs.length - 1; position > 0; position--) {
		const newPosition = Math.floor(Math.random() * (position + 1));
		const placeholder = queue.songs[position];
		queue.songs[position] = queue.songs[newPosition];
		queue.songs[newPosition] = placeholder;
	}

	const embed = new MessageEmbed();
	shuffle(embed, interaction);
	await interaction.reply({ embeds: [embed] });
}