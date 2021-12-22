const { createAudioResource, createAudioPlayer, NoSubscriberBehavior, getVoiceConnection } = require('@discordjs/voice');
const { MessageEmbed } = require('discord.js');
const play = require('play-dl');
const { getQueue } = require('./queue-system');
const { editEmbed } = require('./utils/embeds');
const { playMessage } = require('./utils/play-message');

module.exports.playMusic = async (interaction) => {
	// Refresh token if expired
	if (play.is_expired()) await play.refreshToken();

	// Get necessary data to play music
	const guild = interaction.guild.id;
	const connection = getVoiceConnection(guild);

	const guildQueue = getQueue(guild);
	const songs = guildQueue.songs;

	if (!songs[guildQueue.position] && guildQueue.loop === true) {
		guildQueue.position = 0;
	}
	if (!songs[guildQueue.position]) {
		guildQueue.songs = [];
		guildQueue.position = 0;
		return;
	}
	
	// Get song audio
	let song, stream;
	if (!songs[guildQueue.position].title) {
		[song] = await play.search(songs[guildQueue.position].sp, { limit:1 });
		stream = await play.stream(song.url)
		.catch(async (error) => {
			console.error(error);
			const song2 = await play.search(songs[guildQueue.position].song, { limit:2 });
			stream = await play.stream(song2[1].url);
			return stream;
		});
	}
	else {
		stream = await play.stream(songs[guildQueue.position].url);
	}

	// Create Player
	let player, resource;

	if (!player && !resource) {
		player = createAudioPlayer({
			behaviors: NoSubscriberBehavior.Play,
		});
	
		resource = createAudioResource(stream.stream, {
			inputType: stream.type,
		});
	}
	
	player.play(resource);
	connection.subscribe(player);

	// Player State Checker
	player.on('stateChange', async (oldState, newState) => {
		console.log(`Switch transitioned from ${oldState.status} to ${newState.status}`);

		if (oldState.status === 'buffering' && newState.status === 'playing') {
			playMessage(interaction, songs[guildQueue.position]);
		}

		if (oldState.status === 'playing' && newState.status === 'idle') {
			guildQueue.position++;
			this.playMusic(interaction);
		}
	});

	player.on('error', error => {
		console.error('Player Error:', error);
		if (error === 'Invalid URL') {
			const embed = new MessageEmbed();
			editEmbed.invalidUrl(embed);
			interaction.channel.send({ embeds:[embed] });
			return;
		}
		this.playMusic(interaction);
	});
};