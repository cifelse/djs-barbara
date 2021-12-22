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
		const query = interaction.options.getString('query');
		console.log({ query });
		const embed = new MessageEmbed();

		if (userNotConntected(interaction)) return;

		if (play.is_expired()) await play.refreshToken();

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
		if (check === 'search' || check === 'yt_video') {
			const [track] = await play.search(query, { limit: 1 });
			addSongToQueue(guild, track);
			editEmbed.addedToQueue(embed, track, interaction);
		}
		else if (check === 'yt_playlist') {
			songs = await play.playlist_info(query);
			const tracks = songs.page(1);

			for (const track of tracks) {
				addSongToQueue(guild, track);
			}
			editEmbed.youtubePlaylist(embed, songs, interaction);
		}
		else if (check === 'sp_track') {
			const track = await play.spotify(query);
			const song = `${track.name} by ${track.artists[0].name}`;
			result = {
				sp: song,
				url: track.url,
				durationInMs: track.durationInMs,
			};
			addSongToQueue(guild, result);
			editEmbed.addedToQueue(embed, result, interaction);
		}
		else if (check === 'sp_playlist') {
			songs = await play.spotify(query);
			const tracks = songs.page(1);
			for (const track of tracks) {
				const song = `${track.name} by ${track.artists[0].name}`;
				result = {
					sp: song,
					url: track.url,
					durationInMs: track.durationInMs,
				};
				addSongToQueue(guild, result);
			}
			editEmbed.spotifyPlaylist(embed, songs, interaction);
		}
		else if (check === 'sp_album') {
			songs = await play.spotify(query);
			const tracks = songs.page(1);
			for (const track of tracks) {
				const song = `${track.name} by ${track.artists[0].name}`;
				result = {
					sp: song,
					url: track.url,
					durationInMs: track.durationInMs,
				};
				addSongToQueue(guild, result);
			}
			editEmbed.spotifyAlbum(embed, songs, interaction);
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