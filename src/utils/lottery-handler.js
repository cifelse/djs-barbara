const { MessageButton, MessageActionRow, MessageEmbed } = require('discord.js');
const { editEmbed } = require('./embeds');
const { hangar, concorde } = require('./ids.json');
const { scheduleJob } = require('node-schedule');
const { saveLottery, getLotteryEntries, getGamblers, insertGambler, updateLotteryEntries, checkMaxTicketsAndEntries, removeMiles } = require('../database/lottery-db');
const { CronJob } = require('cron');
const ids = require('./ids.json');

async function startLottery(interaction, details, client) {
	const embed = editEmbed.lotteryEmbed(interaction, details);
	const row = new MessageActionRow();
	row.addComponents(
		new MessageButton()
			.setCustomId('bet')
			.setLabel('🎫 0')
			.setStyle('PRIMARY'),
	);
	const channel = interaction.guild.channels.cache.get(details.channel_id);
	const message = await channel.send({ embeds: [embed], components: [row], fetchReply: true });

	details.lottery_id = message.id;
	details.num_entries = 0;
	
	saveLottery(details);
	scheduleLottery(client, [details]);
	await interaction.reply({ content: `Lottery successfully launched for **"${details.title}"**!` });

	// Send A Copy on Server Logs
	embed.setDescription(`A lottery has started. Go to this lottery by [clicking here.](${message.url})`);
	embed.addField('_ _\nChannel', `<#${details.channel_id}>`);
	embed.setFooter({ text: `${details.lottery_id}` });
	embed.setTimestamp();
	embed.fields.forEach(field => {
		if (field.name === '_ _\nDuration') field.name = '_ _\nTime';
	});
	const logsChannel = interaction.guild.channels.cache.get(hangar.channels.barbaraLogs);
	await logsChannel.send({ embeds: [embed] });
}

async function scheduleLottery(client, details) {
	for (let i = 0; i < details.length; i++) {
		const currentDate = new Date().getTime();
		const endDate = Date.parse(details[i].end_date);

		if (endDate < currentDate) continue;
		const { title, num_winners, end_date, channel_id, lottery_id } = details[i];
		
		console.log('Barbara: Alert! I\'m Scheduling a Lottery for', end_date);
		
		const channel = client.channels.cache.get(channel_id);
		let message;
		if (channel) message = await channel.messages.fetch(lottery_id);
			
		const watchEntries = new CronJob('* * * * * *', () => {
			getLotteryEntries(lottery_id, async (result) => {
				const entries = result[0].num_entries;
				const newButton = message.components[0].components[0];

				// Check for number of entries
				if (entries == newButton.label.replace(/[^\d]+/gi, '')) return;

				console.log(`Barbara: There are a total of ${entries} participants now!`);

				newButton.setLabel(`🎫 ${entries}`);
				const row = new MessageActionRow();
				row.addComponents(newButton);
				await message.edit({ components: [row] });

			});
		});
		watchEntries.start();
	
		scheduleJob(end_date, async () => {
			watchEntries.stop();
			getGamblers(lottery_id, async users => {
				const winners = determineWinners(users, num_winners);
	
				// Put winners in string
				let winnerString = '';

				if (winners.length > 0) {
					winners.forEach(winner => {
						winnerString += `<@${winner.discord_id}> `;
					});
				}
				else {
					winnerString = 'None';
				}
				
				// Get channel and message to edit and announce winners
				if (channel) {
					if (message) {
						// Edit Embed of Lottery Message
						const editedEmbed = message.embeds[0];
						editedEmbed.setColor('RED');
						editedEmbed.setFooter({ text: `${message.id}` });
						editedEmbed.setTimestamp();
						editedEmbed.spliceFields(0, editedEmbed.fields.length, [
							{ name: '_ _\nEnded', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }, 
							{ name: '_ _\nWinner/s', value: `${winnerString}`, inline: true },
						]);
						
						if (winners.length === 0) {
							editedEmbed.setDescription('**Lottery has ended.** Sadly, no one joined the lottery so no one won. 😢');
							message.edit({ embeds:[editedEmbed], components: [] });
						}
						else {
							editedEmbed.setDescription('Oh honey, I would like to extend but we need to end at some point. **Congratulations to the winner/s!** 🎉 Make sure to register a passport over at <#915156513339891722> or else I\'ll have to disqualify you. 😉');
							const disabledButton = message.components[0].components[0];
							disabledButton.setDisabled(true);
							const newRow = new MessageActionRow();
							newRow.addComponents(disabledButton);
							message.edit({ embeds:[editedEmbed], components: [newRow] });
							channel.send(`Congratulations to ${winnerString}for winning **"${title}"** 🎉\n\n**Important Note:**\nMake sure to register a passport. Just in case you haven't, you can do that at <#915156513339891722>. *Failure to do so will disqualify you from this lottery.*`);
						}

						// Edit Lottery logs message
						const serverLogs = client.channels.cache.get(hangar.channels.barbaraLogs);
						let logMessage;
						if (serverLogs) {
							const logMessages = await serverLogs.messages.fetch({ limit: 20 });
							logMessages.forEach(fetchedMessage => {
								if (!fetchedMessage.embeds[0] || !fetchedMessage.embeds[0].footer) return;
								if (fetchedMessage.embeds[0].footer.text === lottery_id) {
									logMessage = fetchedMessage;
								}
							});
						}
						const row = new MessageActionRow();
						const rerollButton = new MessageButton()
							.setCustomId('reroll')
							.setLabel('Reroll')
							.setStyle('DANGER');
						row.addComponents(rerollButton);

						const newEmbed = new MessageEmbed();
						newEmbed.setTitle(`${title}`);
						newEmbed.setColor('RED');
						newEmbed.setDescription(`Lottery has ended. Go to this lottery by [clicking here.](${message.url})`);
						newEmbed.setFooter({ text: `${lottery_id}` });
						newEmbed.setTimestamp();
						newEmbed.spliceFields(0, newEmbed.fields.length, [
							{ name: '_ _\nEnded', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }, 
							{ name: '_ _\nChannel', value: `<#${channel_id}>`, inline: true },
							{ name: '_ _\nWinner/s', value: `${winnerString}`, inline: false },
							{ name: '_ _\nReroll Reminder', value: `Only the <@&${ids.concorde.roles.headPilot}> and the <@&${ids.concorde.roles.crew}> can use the Reroll Button.\n\nFor additional protection, **the Reroll Button will be disabled after 24 hours.**`, inline: false },
						]);
						
						if (winners.length === 0) {
							rerollButton.setDisabled(true);
						}
						// If there are winners
						const newRow = new MessageActionRow();
						newRow.addComponents(rerollButton);
						await logMessage.edit({ embeds:[newEmbed], components: [newRow] });						
					}
				}
			});
		});
	}
}

function determineWinners(users, winnerCount) {
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

async function checkEligibility(interaction) {
	if (interaction.user.bot) return false;

	const requirementsField = interaction.message.embeds[0].fields.find(field => field.value.includes('Free for All'));
	if (requirementsField) return true;

	const eligible = interaction.member.roles.cache.some(role => role.id === concorde.roles.frequentFlyer || role.id === concorde.roles.multiplier.premiumEcon || role.id === concorde.roles.multiplier.businessClass || role.id === concorde.roles.multiplier.jetsetters);

	return eligible;
}

async function enterLottery(interaction) {
	const eligible = await checkEligibility(interaction);
	if (!eligible) {
		await interaction.reply({ content: 'You are not eligible to participate in this lottery yet.', ephemeral: true });
		return;
	}
	const lotteryId = interaction.message.id;
	const discordId = interaction.user.id;

	// Check how many tickets a passenger has in a lottery + check the max tickets of that lottery:
	checkMaxTicketsAndEntries(lotteryId, discordId, async result => {
		if (result.entries >= result.max_tickets) {
			await interaction.reply({ content: 'You already reached the limit for bidding in this lottery.', ephemeral: true });
			return;
		}

		let additionalFee = 25;
		if (result.entries > 1) {
			additionalFee *= result.entries;
		}
		const newFee = parseInt(result.entries) + additionalFee;

		removeMiles(discordId, newFee, async exceeded => {
			if (exceeded === null) {
				await interaction.reply({ content: 'User does not have any MILES yet.', ephemeral: true });
				return;
			}
			else if (exceeded) {
				await interaction.reply({ content: 'Invalid MILES quantity. You can\'t remove more than the user\'s current balance.', ephemeral: true });
				return
			}

			// Accept Entry and Insert to Database
			insertGambler(lotteryId, discordId);
			updateLotteryEntries(lotteryId);
			await interaction.reply({ content: 'You have successfully entered the Lottery!', ephemeral: true });
		});
	});
}

module.exports = {
	startLottery,
	scheduleLottery,
	enterLottery
};