import { SlashCommandBuilder } from '@discordjs/builders';
import { getVoiceConnection } from '@discordjs/voice';
import { MessageEmbed } from 'discord.js';
import { clear } from '../utils/embeds/player-embeds.js';
import { botNotConnected, userNotConnected } from '../utils/not-connected.js';
import { clearQueue } from '../utils/player/queue-system.js';


export const data = new SlashCommandBuilder()
	.setName('stop')
	.setDescription('Stops the queue.');

export const execute = async (interaction) => {
	const guild = interaction.guild.id;
	const connection = getVoiceConnection(guild);

	if (await userNotConnected(interaction)) return;
	if (await botNotConnected(interaction, connection)) return;

	clearQueue(guild);
	const player = connection.state.subscription.player;
	player.stop();

	const embed = new MessageEmbed();
	clear(embed, interaction);
	await interaction.reply({ embeds: [embed] });
}