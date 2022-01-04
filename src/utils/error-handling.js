const { MessageEmbed } = require('discord.js');
const { editEmbed } = require('./embeds');

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

module.exports = handleError;