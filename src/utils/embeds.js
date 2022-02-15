const { MessageEmbed } = require('discord.js');
const play = require('play-dl');
const hex = require('./hex-values.json');
const { concorde, hangar } = require('./ids.json');

module.exports.editEmbed = {
	play: async (embed, song) => {
		embed.setColor(hex.default);
		embed.setTitle('Now Playing');
		if (song.platform === 'sp') {
			const [searchedSong] = await play.search(song.song, { limit:1 });
			embed.setDescription(`[${searchedSong.title}](${searchedSong.url})`);
			console.log(`Now Playing: ${searchedSong.title}`);
		}
		else {
			embed.setDescription(`[${song.song}](${song.url})`);
			console.log(`Now Playing: ${song.song}`);
		}
	},
	addedToQueue: (embed, search, interaction) => {
		embed.setColor(hex.default)
		.setTitle('Added To Queue');
			embed.setDescription(`[${search.song}](${search.url})`);
		embed.setFooter({ text: `Added by: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
	},
	youtubePlaylist: (embed, playlist, interaction) => {
		embed.setColor(hex.youtube);
		embed.setTitle('Youtube Playlist Added')
			.setFields(
				{ name: 'Playlist:', value: `[${playlist.title}](${playlist.url})`, inline: true },
				{ name: 'Track Count:', value: `${playlist.total_videos}`, inline: true },
			);
		embed.setFooter({ text: `Added by: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
	},
	spotifyPlaylist: (embed, playlist, interaction) => {
		embed.setColor(hex.spotify);
		embed.setTitle('Spotify Playlist Added')
			.setFields(
				{ name: 'Playlist:', value: `[${playlist.name}](${playlist.url})`, inline: true },
				{ name: 'Owner:', value: `[${playlist.owner.name}](${playlist.owner.url})`, inline:true },
				{ name: 'Track Count:', value: `${playlist.tracksCount}`, inline: true },
			)
			.setThumbnail(playlist.thumbnail.url);
		embed.setFooter({ text: `Added by: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
	},
	spotifyAlbum: (embed, album, interaction) => {
		embed.setColor(hex.spotify);
		embed.setTitle('Spotify Album Added')
			.setFields(
				{ name: 'Album:', value: `[${album.name}](${album.url})`, inline: true },
				{ name: 'Artist:', value: `[${album.artists[0].name}](${album.artists[0].url})`, inline:true },
				{ name: 'Track Count:', value: `${album.tracksCount}`, inline: true },
			)
			.setThumbnail(album.thumbnail.url);
		embed.setFooter({ text: `Added by: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
	},
	soundcloudPlaylist: (embed, playlist, interaction) => {
		embed.setColor(hex.soundcloud);
		embed.setTitle('Soundcloud Playlist Added')
			.setFields(
				{ name: 'Playlist:', value: `[${playlist.name}](${playlist.url})`, inline: true },
				{ name: 'Owner:', value: `[${playlist.user.name}](${playlist.user.url})`, inline:true },
				{ name: 'Track Count:', value: `${playlist.tracksCount}`, inline: true },
			);
		embed.setFooter({ text: `Added by: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
	},
	pause: (embed, inteaction) => {
		embed.setColor(hex.pause);
		embed.setDescription(`Barbara has been paused by ${inteaction.member}.`);
	},
	resume: (embed, interaction) => {
		embed.setColor(hex.default);
		embed.setDescription(`Barbara has been resumed by ${interaction.member}`);
	},
	skip: (embed, interaction) => {
		embed.setColor(hex.skip);
		embed.setDescription(`Track has been skipped by ${interaction.member}`);
	},
	clear: (embed, interaction) => {
		embed.setColor(hex.clear);
		embed.setDescription(`Barbara has been stopped by ${interaction.member}`);
	},
	shuffle: (embed, interaction) => {
		embed.setColor(hex.shuffle);
		embed.setDescription(`Queue has been shuffled by ${interaction.member}`);
	},
	loop: (embed, interaction) => {
		embed.setColor(hex.loop);
		embed.setDescription(`Queue has been looped by ${interaction.member}`);
	},
	stopLoop: (embed, interaction) => {
		embed.setColor(hex.stopLoop);
		embed.setDescription(`Loop has been removed by ${interaction.member}`);
	},
	disconnect: (embed, interaction) => {
		embed.setDescription(`Barbara has been disconnected by ${interaction.member}`);
	},
	userNotConnected: (embed) => {
		embed.setColor(hex.error);
		embed.addField('You are not in a voice channel', 'Connect to a voice channel to use Barbara.', true);
	},
	botNotConnected: (embed) => {
		embed.setColor(hex.error);
		embed.addField('Barbara is not connected to a voice channel', 'Use `/play` to connect Barbara.');
	},
	invalidUrl: (embed) => {
		embed.setColor(hex.error);
		embed.addField('Invalid URL', 'Barbara does not support the URL provided.', true);
	},
	error: (embed) => {
		embed.setColor(hex.error);
		embed.setDescription('There was an error while executing the command.');
	},
	noSong: (embed) => {
		embed.setColor(hex.error);
		embed.setDescription('No song is currently playing.');
	},
	removeSong: (embed, song) => {
		if (!song) {
			embed.setColor(hex.error);
			embed.setDescription('There is no song in this position');
			return;
		}

		[song] = song;
		embed.setColor(hex.clear);
		embed.setDescription(`\`${song.song}\` has been removed from queue`);
		
	},
	help: (embed) => {
		embed.setColor(hex.help);
		embed.setTitle('Commands');
		embed.setDescription(`\`/play\`: Play a song in a voice channel.
\`/shuffle\`: Shuffles the queue.
\`/resume\`: Resumes the music.
\`/pause\`: Pauses song from playing.
\`/skip\`: Skips current track.
\`/stop\`: Stops the queue.
\`/disconnect\`: Disconnects from the voice channel.
\`/np\`: Show currently playing song.
\`/loop\`: Loops the queue.
\`/remove\`: Removes a song from queue.
		`);
	},
	unviewable: (embed) => {
		embed.setColor(hex.error);
		embed.setDescription('This playlist type is unviewable');
	},
	timeout: (embed) => {
		embed.setColor(hex.error);
		embed.setDescription('Connection Timeout.');
	},
	giveawayEmbed: (interaction, giveawayDetails) => {
		const giveawayEmbed = new MessageEmbed();
		giveawayEmbed.setColor('#80A3FF')
		.setTitle(giveawayDetails.title)
		.setAuthor({ name: `${interaction.user.username}#${interaction.user.discriminator}`, iconURL: `${interaction.user.displayAvatarURL()}` })
		.setDescription('You know what it is, **Click** 🍷 **to enter the giveaway!**\n')
		.addFields(
			{ name: '_ _\nDuration', value: `<t:${Math.floor(giveawayDetails.end_date.getTime() / 1000)}:R>`, inline: true },
			{ name: '_ _\nWinner/s', value: `${giveawayDetails.num_winners}`, inline: true },
		)
		.setTimestamp();

		if (giveawayDetails.strict_mode === 'on') giveawayEmbed.addField('_ _\nRequirement', 'Free for All');
		else giveawayEmbed.addField('_ _\nRequirement', `At least <@&${concorde.roles.frequentFlyer}> (Level 5)`);

		if (giveawayDetails.multiplier === 'on') giveawayEmbed.addField('_ _\nMultipliers', `<@&${concorde.roles.multiplier.jetsetters}> + 4\n<@&${concorde.roles.multiplier.businessClass}> + 3\n<@&${concorde.roles.multiplier.premiumEcon}> + 2`);
		
		return giveawayEmbed;
	},
};