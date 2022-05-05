import { MessageEmbed, MessageButton, MessageActionRow } from 'discord.js';
import { editEmbed } from './utils/embeds';
import hexColor from '../hex-values.json';

const queue = new Map();
let initial = 0;

export function setQueue(guild, connection) {
	const sourceChannel = {
		voiceChannel: connection,
		songs: [],
		position: 0,
		loop: false,
	};
	queue.set(guild, sourceChannel);
	return queue;
}

export function getQueue(guild) {
	return queue.get(guild);
}

export function addSongToQueue(guild, song) {
	const channelQueue = queue.get(guild);
	channelQueue.songs.push(song);
}

export function clearQueue(guild) {
	const guildQueue = queue.get(guild);
	guildQueue.songs = [];
	guildQueue.position = 0;
	return;
}

export function loopQueue(interaction) {
	const guildQueue = queue.get(interaction.guild.id);
	const embed = new MessageEmbed();
	if (guildQueue.loop === true) {
		guildQueue.loop = false;
		editEmbed.stopLoop(embed, interaction);
		interaction.reply({ embeds: [embed] });
		return;
	}
	guildQueue.loop = true;
	editEmbed.loop(embed, interaction);
	interaction.reply({ embeds: [embed] });
}

export function stopLoop(guild) {
	const guildQueue = queue.get(guild);
	guildQueue.loop = false;
}

export function removeSong(guild, position) {
	const guildQueue = queue.get(guild);

	if (!guildQueue.songs[position])
		return null;

	return guildQueue.songs.splice(position, 1);
}

export async function getNowPlaying(interaction, guild) {
	const guildQueue = queue.get(guild);
	const songs = guildQueue.songs;

	const embed = new MessageEmbed;
	if (!songs[guildQueue.position]) {
		editEmbed.noSong(embed);
	}
	else {
		await editEmbed.play(embed, songs[guildQueue.position]);
	}
	interaction.reply({ embeds: [embed] });
}

export function presentQueue(guild, button) {
	const queueEmbed = new MessageEmbed();
	queueEmbed.setColor(hexColor.default);

	const guildQueue = queue.get(guild);
	const songs = guildQueue.songs;

	if (!songs[0]) {
		queueEmbed.setColor(hexColor.error);
		queueEmbed.setDescription('No song is currently playing.');
		return queueEmbed;
	}

	if (button === 'first') {
		initial = 0;
	}
	else if (button === 'back') {
		initial -= 10;

		if (initial <= 0) {
			initial = 0;
		}
	}
	else if (button === 'next') {
		initial += 10;
		if (initial >= songs.length)
			initial -= 10;
	}
	else if (button === 'last') {
		initial = songs.length - (songs.length % 10);
		if (initial % 10 === 0)
			initial = songs.length - 10;
	}

	let queueString = '';
	let count = 0;

	for (initial; initial < songs.length; initial++) {
		count++;
		if (count > 10)
			break;

		if (!songs[initial])
			break;

		const track = songs[initial];
		if (initial === guildQueue.position)
			queueString += `${initial + 1}. [${track.song}](${track.url}) \`Now Playing\`\n`;
		else
			queueString += `${initial + 1}. [${track.song}](${track.url})\n`;
	}

	initial -= 10;

	queueEmbed.setTitle('Queue');
	queueEmbed.setDescription(queueString);

	return queueEmbed;
}

export function makeQueue(interaction, guild) {
	const queueEmbed = new MessageEmbed();
	queueEmbed.setColor(hexColor.default);

	const queueButtons = new MessageActionRow();

	const firstButton = new MessageButton();
	firstButton.setCustomId('first');
	firstButton.setEmoji('⏮️');
	firstButton.setStyle('SECONDARY');

	const backButton = new MessageButton();
	backButton.setCustomId('back');
	backButton.setEmoji('◀️');
	backButton.setStyle('SECONDARY');

	const nextButton = new MessageButton();
	nextButton.setCustomId('next');
	nextButton.setEmoji('▶️');
	nextButton.setStyle('SECONDARY');

	const lastButton = new MessageButton();
	lastButton.setCustomId('last');
	lastButton.setEmoji('⏭️');
	lastButton.setStyle('SECONDARY');

	queueButtons.addComponents(firstButton, backButton, nextButton, lastButton);

	const guildQueue = queue.get(guild);
	const songs = guildQueue.songs;

	if (!songs[0]) {
		queueEmbed.setColor(hexColor.error);
		queueEmbed.setDescription('No song is currently playing.');
		interaction.reply({ embeds: [queueEmbed] });
		return;
	}

	let queueString = '';

	for (let i = 0; i < 10; i++) {
		if (!songs[i])
			break;

		const track = songs[i];
		if (i === guildQueue.position)
			queueString += `${i + 1}. [${track.song}](${track.url}) \`Now Playing\`\n`;
		else
			queueString += `${i + 1}. [${track.song}](${track.url})\n`;
	}

	queueEmbed.setTitle('Queue');
	queueEmbed.setDescription(queueString);

	interaction.reply({ embeds: [queueEmbed], components: [queueButtons] });
}