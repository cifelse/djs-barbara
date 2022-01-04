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

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Play a song in a voice channel')
		.addStringOption(option => option.setName('query')
			.setDescription('Input a song or URL From Youtube or Spotify')
			.setRequired(true)),
	async execute(interaction) {
		let query = interaction.options.getString('query');
		console.log(`Query: ${query}`);
		const embed = new MessageEmbed();

		if (userNotConntected(interaction)) return;

		if (play.is_expired()) await play.refreshToken();

		if (query.includes('music.youtube')) query = query.replace('music.', '');

		const check = await play.validate(query);

		if (!check) {
			editEmbed.invalidUrl(embed);
			await interaction.followUp({ embeds: [embed] });
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

		let songs, result;

		// Check query platform
		switch (check) {
			case 'search':
			case 'yt_video': {
				const [track] = await play.search(query, { limit: 1 });
				addSongToQueue(guild, track);
				editEmbed.addedToQueue(embed, track, interaction);
				break;
			}
			case 'yt_playlist': {
				songs = await play.playlist_info(query);
				const tracks = songs.page(1);
	
				for (const track of tracks) {
					addSongToQueue(guild, track);
				}
				editEmbed.youtubePlaylist(embed, songs, interaction);
				break;
			}
			case 'sp_track': {
				const track = await play.spotify(query);
				const song = `${track.name} by ${track.artists[0].name}`;
				result = {
					song,
					url: track.url,
					durationInMs: track.durationInMs,
				};
				addSongToQueue(guild, result);
				editEmbed.addedToQueue(embed, result, interaction);
				break;
			}
			case 'sp_playlist': {
				songs = await play.spotify(query);
				const tracks = songs.page(1);
				for (const track of tracks) {
					const song = `${track.name} by ${track.artists[0].name}`;
					result = {
						song,
						url: track.url,
						durationInMs: track.durationInMs,
					};
					addSongToQueue(guild, result);
				}
				editEmbed.spotifyPlaylist(embed, songs, interaction);
				break;
			}
			case 'sp_album': {
				songs = await play.spotify(query);
				const tracks = songs.page(1);
				for (const track of tracks) {
					const song = `${track.name} by ${track.artists[0].name}`;
					result = {
						song,
						url: track.url,
						durationInMs: track.durationInMs,
					};
					addSongToQueue(guild, result);
				}
				editEmbed.spotifyAlbum(embed, songs, interaction);
				break;
			}
			case 'so_track': {
				const track = await play.soundcloud(query);
				const song = `${track.name} by ${track.user.name}`;
				result = {
					song,
					url: track.url,
					durationInMs: track.durationInMs,
				};
				addSongToQueue(guild, result);
				editEmbed.addedToQueue(embed, result, interaction);
				break;
			}
			case 'so_playlist': {
				songs = await play.soundcloud(query);
				const { tracks } = await songs.fetch();
				for (const track of tracks) {
					const song = `${track.name} by ${track.user.name}`;
					result = {
						song,
						url: track.url,
						durationInMs: track.durationInMs,
					};
					addSongToQueue(guild, result);
				}
				editEmbed.soundcloudPlaylist(embed, songs, interaction);
				break;
			}
			default: {
				editEmbed.invalidUrl(embed);
				await interaction.followUp({ embeds: [embed] });
				return;
			}
		}

		// Check if Bot is playing music then add song/s to queue
		const subscription = connection.state.subscription;
		
		if (subscription) {
			const playerStatus = subscription.player.state.status;
			if (playerStatus === 'playing') {
				await interaction.followUp({ embeds: [embed] });
				return;
			}
		}
		
		await interaction.followUp({ embeds: [embed] });
		await playMusic(interaction);
		
	},
};