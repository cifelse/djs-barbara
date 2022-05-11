import { getParticipants, insertGiveawayWinner } from "../database/giveaway-db.js";
import { getGamblers, insertLotteryWinner } from "../database/lottery-db.js";

export const determineWinners = (users, winnerCount) => {
    const numWinners = parseInt(winnerCount);
    const winners = [];

	// Shuffle the array before picking the winners
	for (let position = users.length - 1; position > 0; position--) {
		const newPosition = Math.floor(Math.random() * (position + 1));
		const placeholder = users[position];
		users[position] = users[newPosition];
		users[newPosition] = placeholder;
	}

	// Pick the Winners
    while (winners.length < numWinners && users.length > 0) {

        const random = Math.floor(Math.random() * users.length);

		// Check if users[random] is already a winner
        const duplicate = winners.find(winner => winner.discord_id === users[random].discord_id);
        
		// If users[random] is not yet a winner, add the person to the winners array
        if (!duplicate) winners.push(users[random]);

        // Remove the users[random] from the selection of potential winners
        users.splice(random, 1);
    }

	console.log('Barbara: I\'ve successfully chosen the winners!');
    return winners;
}

export const rerollWinners = async (interaction, type) => {
	// Check Role
	const eligible = interaction.member.roles.cache.hasAny(admin.captain, admin.crew, ram.engineers, keys.hangar.roles.engineers);
	if (!eligible) {
		await interaction.reply({ content: 'You are not eligible to use this button', ephemeral: true });
		return;
	}

	// Get Necessary Details
	const user = interaction.user.id;
	const messageId	= interaction.message.embeds[0].footer.text;
	const title = interaction.message.embeds[0].title;
	const fields = interaction.message.embeds[0].fields;
	
	await interaction.reply({ content: `Enter number of winners for Reroll on **"${title}"**.`, ephemeral: true });
	
	// Get Number of Winners From Message
	const response = await interaction.channel.awaitMessages({ max: 1 });
	const { content } = response.first();
	const numberChecker = /^\d+$/;

	if (!numberChecker.test(content)) {
		await interaction.channel.send({ content: 'You entered an invalid number, honey. Why don\'t you press that Reroll button again?' });
		return;
	}

	// Get Channel Where The Event was hosted
	let channel;
	fields.forEach(async field => {
		if (field.name === '_ _\nChannel') {
			channel = await interaction.guild.channels.cache.get(field.value.replace(/[^\d]+/gi, ''));
		}
	});

	const winnerCount = content;
	let winnerString = '';

	if (type === 'giveaway') {
		getParticipants(messageId, async users => {
			const winners = determineWinners(users, winnerCount);
	
			// Put winners in string and insert to Database
			if (winners.length > 0) {
				winners.forEach(winner => {
					winnerString += `<@${winner.discord_id}> `;
					insertGiveawayWinner(messageId, winner);
				});
			}
	
			// Send Reroll Message with Winners
			await interaction.channel.send(`A Reroll has been requested by <@${user}> on **"${title}"**`);
			await channel.send(`A Reroll has been requested by <@${user}>. Congratulations to the new winners, ${winnerString}for winning **"${title}"** 🎉\n\n**Important Note:**\nMake sure to register a passport. Just in case you haven't, you can do that at <#915156513339891722>. *Failure to do so will disqualify you from this giveaway.*`);
		});
	}
	else if (type === 'lottery') {
		getGamblers(messageId, async users => {
			const winners = determineWinners(users, winnerCount);
	
			// Put winners in string and insert to Database
			if (winners.length > 0) {
				winners.forEach(winner => {
					winnerString += `<@${winner.discord_id}> `;
					insertLotteryWinner(messageId, winner);
				});
			}
	
			// Send Reroll Message with Winners
			await interaction.channel.send(`A Reroll has been requested by <@${user}> on **"${title}"**`);
			await channel.send(`A Reroll has been requested by <@${user}>. Congratulations to the new winners, ${winnerString}for winning **"${title}"** 🎉\n\n**Important Note:**\nMake sure to register a passport. Just in case you haven't, you can do that at <#915156513339891722>. *Failure to do so will disqualify you from this lottery.*`);
		});
	}

	// Delete Response After Sending New Winners
	response.first().delete();
}
