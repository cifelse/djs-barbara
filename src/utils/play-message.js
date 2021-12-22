const { getVoiceConnection, AudioPlayerStatus } = require('@discordjs/voice');
const { MessageEmbed } = require('discord.js');
const { editEmbed } = require('./embeds');

module.exports = {
	playMessage: async (interaction, song) => {
		const embed = new MessageEmbed;
		await editEmbed.play(embed, song);
		const msg = await interaction.channel.send({ embeds: [embed] });

		const connection = getVoiceConnection(interaction.guild.id);
		const player = connection.state.subscription.player;

		player.on(AudioPlayerStatus.Idle, () => {
			msg.delete()
			.catch(error => {
				if (error.code === 1008) console.error('Message Error: Message already deleted.');
			});
		});
	},
};