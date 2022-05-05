import { MessageEmbed } from 'discord.js';
import { editEmbed } from '../utils/embeds/embeds.js';

function handleError(error) {
	console.error(error);
	const embed = new MessageEmbed();

	if (error.message.includes('unviewable')) {
		editEmbed.unviewable(embed);
	}
	else if (error.code === 'ETIMEDOUT') {
		editEmbed.timeout(embed);
	}
	else {
		editEmbed.error(embed);
	}
	return embed;
}

export default handleError;