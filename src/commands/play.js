// Libraries
import { getVoiceConnection, joinVoiceChannel } from '@discordjs/voice';
import { SlashCommandBuilder } from '@discordjs/builders';
import { is_expired, refreshToken, validate, search, playlist_info, spotify, soundcloud } from 'play-dl';
import { MessageEmbed } from 'discord.js';

// Own Exports
import { userNotConnected } from '../utils/player/not-connected.js';
import { invalidUrl, youtubePlaylist, spotifyPlaylist, spotifyAlbum, soundcloudPlaylist, addedToQueue } from '../utils/embeds/player-embeds.js';
import { addSongToQueue, setQueue } from '../utils/player/queue-system.js';
import { getSongData } from '../utils/player/song-data.js';
import { playMusic } from '../utils/player/connect-play.js';

export const data = new SlashCommandBuilder()
	.setName('play')
	.setDescription('Play a song in a voice channel')
	.addStringOption(option => option.setName('query')
		.setDescription('Input a song or URL From Youtube, Spotify or Soundcloud')
		.setRequired(true));

export const execute = async (interaction) => {
	const query = interaction.options.getString('query');
	console.log(`Barbara Query: ${query}`);
	const embed = new MessageEmbed();

	if (await userNotConnected(interaction)) return;

	if (is_expired()) await refreshToken();

	const check = await validate(query);

	if (!check) {
		invalidUrl(embed);
		await interaction.reply({ embeds: [embed] });
		return;
	}

	// Establish connection
	const guild = interaction.guild.id;
	let connection = getVoiceConnection(interaction.guild.id);

	if (!connection) {
		connection = joinVoiceChannel({
			channelId: interaction.member.voice.channel.id,
			guildId: interaction.guild.id,
			adapterCreator: interaction.guild.voiceAdapterCreator,
		});

		setQueue(guild, connection);
	}

	let songs;

	// Check query platform
	switch (check) {
		case 'search':
		case 'yt_video': {
			const [track] = await search(query, { limit: 1 });
			const song = getSongData(track, 'yt');
			addSongToQueue(guild, song);
			addedToQueue(embed, song, interaction);
			break;
		}
		case 'yt_playlist': {
			songs = await playlist_info(query);
			const tracks = songs.page(1);

			for (const track of tracks) {
				const song = getSongData(track, 'yt');
				addSongToQueue(guild, song);
			}
			youtubePlaylist(embed, songs, interaction);
			break;
		}
		case 'sp_track': {
			const track = await spotify(query);
			const song = getSongData(track, 'sp');
			addSongToQueue(guild, song);
			addedToQueue(embed, song, interaction);
			break;
		}
		case 'sp_playlist': {
			songs = await spotify(query);
			const tracks = songs.page(1);
			for (const track of tracks) {
				const song = getSongData(track, 'sp');
				addSongToQueue(guild, song);
			}
			spotifyPlaylist(embed, songs, interaction);
			break;
		}
		case 'sp_album': {
			songs = await spotify(query);
			const tracks = songs.page(1);
			for (const track of tracks) {
				const song = getSongData(track, 'sp');
				addSongToQueue(guild, song);
			}
			spotifyAlbum(embed, songs, interaction);
			break;
		}
		case 'so_track': {
			const track = await soundcloud(query);
			const song = getSongData(track, 'so');
			addSongToQueue(guild, song);
			addedToQueue(embed, song, interaction);
			break;
		}
		case 'so_playlist': {
			songs = await soundcloud(query);
			const { tracks } = await songs.fetch();
			for (const track of tracks) {
				const song = getSongData(track, 'so');
				addSongToQueue(guild, song);
			}
			soundcloudPlaylist(embed, songs, interaction);
			break;
		}
		default: {
			invalidUrl(embed);
			await interaction.reply({ embeds: [embed] });
			return;
		}
	}

	// Check if Bot is playing music then add song/s to queue
	const subscription = connection.state.subscription;

	if (subscription) {
		const playerStatus = subscription.player.state.status;
		if (playerStatus === 'playing') {
			await interaction.reply({ embeds: [embed] });
			return;
		}
	}

	await interaction.reply({ embeds: [embed] });
	await playMusic(interaction);

}