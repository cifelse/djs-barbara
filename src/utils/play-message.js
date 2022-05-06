import { getVoiceConnection, AudioPlayerStatus } from '@discordjs/voice';
import { MessageEmbed } from 'discord.js';
import { play } from './embeds/player-embeds.js';

export const playMessage = async (interaction, song) => {
	const embed = new MessageEmbed;
	await play(embed, song);
	const msg = await interaction.channel.send({ embeds: [embed] });

	const connection = getVoiceConnection(interaction.guild.id);
	const player = connection.state.subscription.player;

	player.on(AudioPlayerStatus.Idle, () => {
		msg.delete()
			.catch(error => {
				if (error.code === 1008)
					console.error('Message Error: Message already deleted.');
			});
	});
}