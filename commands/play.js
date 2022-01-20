// Libraries
const { getVoiceConnection, joinVoiceChannel } = require('@discordjs/voice');
const { SlashCommandBuilder } = require('@discordjs/builders');
const play = require('play-dl');

// Own Exports
const { editEmbed } = require('../src/utils/embeds');
const { userNotConntected } = require('../src/utils/not-connected');
const { setQueue, addSongToQueue } = require('../src/queue-system');
const { playMusic } = require('../src/connect-play');
const { MessageEmbed } = require('discord.js');
const { getSongData } = require('../src/utils/song-data');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Play a song in a voice channel')
		.addStringOption(option => option.setName('query')
			.setDescription('Input a song or URL From Youtube, Spotify or Soundcloud')
			.setRequired(true)),
	async execute(interaction) {
		const query = interaction.options.getString('query');
		console.log(`Query: ${query}`);
		const embed = new MessageEmbed();

		if (userNotConntected(interaction)) return;

		if (play.is_expired()) await play.refreshToken();

		const check = await play.validate(query);

		if (!check) {
			editEmbed.invalidUrl(embed);
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
				const [track] = await play.search(query, { limit: 1 });
				const song = getSongData(track, 'yt');
				addSongToQueue(guild, song);
				editEmbed.addedToQueue(embed, song, interaction);
				break;
			}
			case 'yt_playlist': {
				songs = await play.playlist_info(query);
				const tracks = songs.page(1);
	
				for (const track of tracks) {
					const song = getSongData(track, 'yt');
					addSongToQueue(guild, song);
				}
				editEmbed.youtubePlaylist(embed, songs, interaction);
				break;
			}
			case 'sp_track': {
				const track = await play.spotify(query);
				const song = getSongData(track, 'sp');
				addSongToQueue(guild, song);
				editEmbed.addedToQueue(embed, song, interaction);
				break;
			}
			case 'sp_playlist': {
				songs = await play.spotify(query);
				const tracks = songs.page(1);
				for (const track of tracks) {
					const song = getSongData(track, 'sp');
					addSongToQueue(guild, song);
				}
				editEmbed.spotifyPlaylist(embed, songs, interaction);
				break;
			}
			case 'sp_album': {
				songs = await play.spotify(query);
				const tracks = songs.page(1);
				for (const track of tracks) {
					const song = getSongData(track, 'sp');
					addSongToQueue(guild, song);
				}
				editEmbed.spotifyAlbum(embed, songs, interaction);
				break;
			}
			case 'so_track': {
				const track = await play.soundcloud(query);
				const song = getSongData(track, 'so');
				addSongToQueue(guild, song);
				editEmbed.addedToQueue(embed, song, interaction);
				break;
			}
			case 'so_playlist': {
				songs = await play.soundcloud(query);
				const { tracks } = await songs.fetch();
				for (const track of tracks) {
					const song = getSongData(track, 'so');
					addSongToQueue(guild, song);
				}
				editEmbed.soundcloudPlaylist(embed, songs, interaction);
				break;
			}
			default: {
				editEmbed.invalidUrl(embed);
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
		
	},
};