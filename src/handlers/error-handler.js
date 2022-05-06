import { MessageEmbed } from 'discord.js';
import { timeout, error as _error } from '../utils/embeds/general-embeds.js';
import { unviewable } from '../utils/embeds/player-embeds.js';

export const handleError = (error) => {
	console.error(error);
	const embed = new MessageEmbed();

	if (error.message.includes('unviewable')) {
		unviewable(embed);
	}
	else if (error.code === 'ETIMEDOUT') {
		timeout(embed);
	}
	else {
		_error(embed);
	}
	return embed;
}