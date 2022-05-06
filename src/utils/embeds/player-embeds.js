import { search } from 'play-dl';
import { hexColor } from '../hex-values.js';

export const play = async (embed, song) => {
	embed.setColor(hexColor.default);
	embed.setTitle('Now Playing');
	if (song.platform === 'sp') {
		const [searchedSong] = await search(song.song, { limit:1 });
		embed.setDescription(`[${searchedSong.title}](${searchedSong.url})`);
		console.log(`Now Playing: ${searchedSong.title}`);
	}
	else {
		embed.setDescription(`[${song.song}](${song.url})`);
		console.log(`Now Playing: ${song.song}`);
	}
}

export const addedToQueue = (embed, search, interaction) => {
	embed.setColor(hexColor.default)
	.setTitle('Added To Queue');
		embed.setDescription(`[${search.song}](${search.url})`);
	embed.setFooter({ text: `Added by: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
}

export const youtubePlaylist = (embed, playlist, interaction) => {
	embed.setColor(hexColor.youtube);
	embed.setTitle('Youtube Playlist Added')
		.setFields(
			{ name: 'Playlist:', value: `[${playlist.title}](${playlist.url})`, inline: true },
			{ name: 'Track Count:', value: `${playlist.total_videos}`, inline: true },
		);
	embed.setFooter({ text: `Added by: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
}

export const spotifyPlaylist = (embed, playlist, interaction) => {
	embed.setColor(hexColor.spotify);
	embed.setTitle('Spotify Playlist Added')
		.setFields(
			{ name: 'Playlist:', value: `[${playlist.name}](${playlist.url})`, inline: true },
			{ name: 'Owner:', value: `[${playlist.owner.name}](${playlist.owner.url})`, inline:true },
			{ name: 'Track Count:', value: `${playlist.tracksCount}`, inline: true },
		)
		.setThumbnail(playlist.thumbnail.url);
	embed.setFooter({ text: `Added by: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
}

export const spotifyAlbum = (embed, album, interaction) => {
	embed.setColor(hexColor.spotify);
	embed.setTitle('Spotify Album Added')
		.setFields(
			{ name: 'Album:', value: `[${album.name}](${album.url})`, inline: true },
			{ name: 'Artist:', value: `[${album.artists[0].name}](${album.artists[0].url})`, inline:true },
			{ name: 'Track Count:', value: `${album.tracksCount}`, inline: true },
		)
		.setThumbnail(album.thumbnail.url);
	embed.setFooter({ text: `Added by: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
}

export const soundcloudPlaylist = (embed, playlist, interaction) => {
	embed.setColor(hexColor.soundcloud);
	embed.setTitle('Soundcloud Playlist Added')
		.setFields(
			{ name: 'Playlist:', value: `[${playlist.name}](${playlist.url})`, inline: true },
			{ name: 'Owner:', value: `[${playlist.user.name}](${playlist.user.url})`, inline:true },
			{ name: 'Track Count:', value: `${playlist.tracksCount}`, inline: true },
		);
	embed.setFooter({ text: `Added by: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
}

export const pause = (embed, inteaction) => {
	embed.setColor(hexColor.pause);
	embed.setDescription(`Barbara has been paused by ${inteaction.member}.`);
}

export const resume = (embed, interaction) => {
	embed.setColor(hexColor.default);
	embed.setDescription(`Barbara has been resumed by ${interaction.member}`);
}

export const skip = (embed, interaction) => {
	embed.setColor(hexColor.skip);
	embed.setDescription(`Track has been skipped by ${interaction.member}`);
}

export const clear = (embed, interaction) => {
	embed.setColor(hexColor.clear);
	embed.setDescription(`Barbara has been stopped by ${interaction.member}`);
}

export const shuffle = (embed, interaction) => {
	embed.setColor(hexColor.shuffle);
	embed.setDescription(`Queue has been shuffled by ${interaction.member}`);
}

export const loop = (embed, interaction) => {
	embed.setColor(hexColor.loop);
	embed.setDescription(`Queue has been looped by ${interaction.member}`);
}

export const stopLoop = (embed, interaction) => {
	embed.setColor(hexColor.stopLoop);
	embed.setDescription(`Loop has been removed by ${interaction.member}`);
}

export const disconnect = (embed, interaction) => {
	embed.setDescription(`Barbara has been disconnected by ${interaction.member}`);
}

export const userNotConnected = (embed) => {
	embed.setColor(hexColor.error);
	embed.addField('You are not in a voice channel', 'Connect to a voice channel to use Barbara.', true);
}

export const botNotConnected = (embed) => {
	embed.setColor(hexColor.error);
	embed.addField('Barbara is not connected to a voice channel', 'Use `/play` to connect Barbara.');
}

export const invalidUrl = (embed) => {
	embed.setColor(hexColor.error);
	embed.addField('Invalid URL', 'Barbara does not support the URL provided.', true);
}

export const noSong = (embed) => {
	embed.setColor(hexColor.error);
	embed.setDescription('No song is currently playing.');
}

export const removeSong = (embed, song) => {
	if (!song) {
		embed.setColor(hexColor.error);
		embed.setDescription('There is no song in this position');
		return;
	}

	[song] = song;
	embed.setColor(hexColor.clear);
	embed.setDescription(`\`${song.song}\` has been removed from queue`);
	
}

export const help = (embed) => {
	embed.setColor(hexColor.help);
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
}

export const unviewable = (embed) => {
	embed.setColor(hexColor.error);
	embed.setDescription('This playlist type is unviewable');
}