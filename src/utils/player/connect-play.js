import { createAudioResource, createAudioPlayer, NoSubscriberBehavior, getVoiceConnection } from '@discordjs/voice';
import play from 'play-dl';
import { getQueue } from './queue-system.js';
import { playMessage } from '../play-message.js';
import { handleError } from '../../handlers/error-handler.js';

export const playMusic = async (interaction) => {
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
	if (songs[guildQueue.position].platform === 'sp') {
		[song] = await play.search(songs[guildQueue.position].song, { limit:1 });
		stream = await play.stream(song.url);
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
		console.log(`Barbara transitioned from ${oldState.status} to ${newState.status}`);

		if (oldState.status === 'buffering' && newState.status === 'playing') {
			playMessage(interaction, songs[guildQueue.position]);
		}

		if (oldState.status === 'playing' && newState.status === 'idle') {
			guildQueue.position++;
			await this.playMusic(interaction);
		}
	});

	// Player Error Handler
	player.on('error', async error => {
		const handledError = handleError(error);
		await interaction.channel.send({ embeds:[handledError] });
		await this.playMusic(interaction);
	});
}