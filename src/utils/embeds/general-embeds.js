import { search as _search } from 'play-dl';
import { hexColor } from '../hex-values.js';

export const timeout = (embed) => {
		embed.setColor(hexColor.error);
		embed.setDescription('Connection Timeout.');
}

export const error = (embed) => {
	embed.setColor(hexColor.error);
	embed.setDescription('There was an error while executing the command.');
}