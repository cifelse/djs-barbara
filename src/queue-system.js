const { MessageEmbed } = require('discord.js');
const { editEmbed } = require('./utils/embeds');
const hex = require('./utils/hex-values.json');

const queue = new Map();

module.exports = {
	setQueue: (guild, connection) => {
		const sourceChannel = { 
			voiceChannel: connection,
			songs: [],
			position: 0,
			loop: false,
		};
		queue.set(guild, sourceChannel);
		return queue;
	},
	getQueue: (guild) => {
		return queue.get(guild);
	},
	addSongToQueue: (guild, song) => {
		const channelQueue = queue.get(guild);
		channelQueue.songs.push(song);
	},
	clearQueue: (guild) => {
		const guildQueue = queue.get(guild);
		guildQueue.songs = [];
		guildQueue.position = 0;
		return;
	},
	presentQueue: (guild) => {
		const embed = new MessageEmbed();
		const guildQueue = queue.get(guild);
		const songs = guildQueue.songs;
		embed.setColor(hex.default);
		embed.setTitle('Queue');
		if (!songs[0]) {
			embed.setDescription('Queue is empty');
			return embed;
		}
		for (let i = guildQueue.position; i < songs.length; i++) {
			const track = songs[i];
			if (!track.title) {
				if (i === guildQueue.position) embed.addField('Now Playing: ', `[${track.song}](${track.url})`);
				else if (i === guildQueue.position + 1) embed.addField('Next Song:', `[${track.song}](${track.url})`);
				else embed.addField(`${i + 1}.`, `[${track.song}](${track.url})`);
			}
			else if (!track.song) {
				if (i === guildQueue.position) embed.addField('Now Playing: ', `[${track.title}](${track.url})`);
				else if (i === guildQueue.position + 1) embed.addField('Next Song:', `[${track.title}](${track.url})`);
				else embed.addField(`${i + 1}.`, `[${track.title}](${track.url})`);
			}
		}
		return embed;
	},
	loopQueue: (interaction) => {
		const guildQueue = queue.get(interaction.guild.id);
		const embed = new MessageEmbed();
		if (guildQueue.loop === true) {
			guildQueue.loop = false;
			editEmbed.stopLoop(embed, interaction);
			interaction.followUp({ embeds: [embed] });
			return;
		}
		guildQueue.loop = true;
		editEmbed.loop(embed, interaction);
		interaction.followUp({ embeds: [embed] });
	},
	stopLoop: (guild) => {
		const guildQueue = queue.get(guild);
		guildQueue.loop = false;
	},
	removeSong: (guild, position) => {
		const guildQueue = queue.get(guild);

		if (!guildQueue.songs[position]) return null;

		return guildQueue.songs.splice(position, 1);
	},
	getNowPlaying: async (interaction, guild) => {
		const guildQueue = queue.get(guild);
		const songs = guildQueue.songs;

		const embed = new MessageEmbed;
		if (!songs[guildQueue.position]) {
			editEmbed.noSong(embed);
		}
		else {
			await editEmbed.play(embed, songs[guildQueue.position]);
		}
		interaction.followUp({ embeds: [embed] });
	},
};