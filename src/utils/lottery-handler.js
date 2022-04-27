const { MessageButton, MessageActionRow, MessageEmbed } = require('discord.js');
const { editEmbed } = require('./embeds');
const { hangar, concorde } = require('./ids.json');
const { scheduleJob } = require('node-schedule');
const { saveLottery, getLotteryEntries, getGamblers, updateLotteryEntries, checkMaxTicketsAndEntries, removeMiles, getDataForBet, getStrictMode, insertLotteryEntry } = require('../database/lottery-db');
const { CronJob } = require('cron');
const ids = require('./ids.json');
const { convertTimestampToDate } = require('./date-handler');

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
	const logsChannel = interaction.guild.channels.cache.get(concorde.channels.lotteryLogs);
	await logsChannel.send({ embeds: [embed] });
}

async function scheduleLottery(client, details) {
	for (let i = 0; i < details.length; i++) {
		const { title, num_winners, end_date, channel_id, lottery_id } = details[i];

		const currentDate = new Date().getTime();
		const endDate = Date.parse(end_date);

		if (endDate < currentDate) continue;
		
		console.log('Barbara: Alert! I\'m Scheduling a Lottery for', title);
		
		let message;
		const channel = client.channels.fetch(channel_id);
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
		
		const scheduledEndDate = convertTimestampToDate(end_date);
		scheduleJob(scheduledEndDate, async () => {
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
						const serverLogs = client.channels.cache.get(concorde.channels.lotteryLogs);
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

function confirmBet(interaction) {
	const lotteryId = interaction.message.id;
	const discordId = interaction.user.id;

	getDataForBet(lotteryId, discordId, async lottery => {

		let additionalFee = 25;

		if (lottery.entries <= 0) {
			additionalFee = 0;
		}
		if (lottery.entries > 1) {
			additionalFee *= lottery.entries;
		}

		const newFee = parseInt(lottery.price) + additionalFee;

		const embed = {
			description: `You're about to purchase a lottery ticket for **"${lottery.title}"** for **${newFee} MILES**. To continue, press the **Confirm** button below.`,
			color: '80A3FF',
			footer: { text: `Lottery ID: ${lotteryId}` },
		}
	
		const buttons = new MessageActionRow();
		buttons.addComponents(
			new MessageButton()
				.setStyle('SUCCESS')
				.setLabel('Confirm')
				.setCustomId('confirmBet')
		);
	
		await interaction.reply({ embeds: [embed], components: [buttons], ephemeral: true });
	});
}

async function enterLottery(interaction) {
	const lotteryId = interaction.message.embeds[0].footer.text.replace(/[^\d]+/gi, '');
	const discordId = interaction.user.id;

	getStrictMode(lotteryId, async lottery => {
		const { frequentFlyer, multiplier: { premiumEcon, businessClass, jetsetters } } = concorde.roles;
		const eligibleRole = interaction.member.roles.cache.hasAny(frequentFlyer, premiumEcon, businessClass, jetsetters);
		const embed = interaction.message.embeds[0];
		embed.setFooter({ text: ' ' });

		if (interaction.user.bot || (lottery.ffa === 'off' && !eligibleRole)) {
			embed.description = 'You are not eligible to participate in this lottery yet.';
			await interaction.update({ embeds:[embed], components: [], ephemeral: true });
			return;
		}
		
		// Check how many tickets a passenger has in a lottery + check the max tickets of that lottery:
		checkMaxTicketsAndEntries(lotteryId, discordId, async result => {
			if (result.entries >= result.max_tickets) {
				embed.description = 'You have reached the maximum number of tickets for this lottery.';
				await interaction.update({ embeds:[embed], components: [], ephemeral: true });
				return;
			}

			let additionalFee = 25;

			if (result.entries <= 0) {
				additionalFee = 0;
			}
			if (result.entries > 1) {
				additionalFee *= result.entries;
			}

			const newFee = parseInt(result.price) + additionalFee;

			removeMiles(discordId, newFee, async exceeded => {
				if (exceeded === null) {
					embed.description = `User does not have any MILES yet.`;
					await interaction.update({ embeds: [embed], components: [], ephemeral: true });
					return;
				}
				else if (exceeded) {
					embed.description = `Invalid MILES quantity. You can\'t remove more than the user\'s current balance.`;
					await interaction.update({ embeds: [embed], components: [], ephemeral: true });
					return;
				}

				// Accept Entry and Insert to Database
				insertLotteryEntry(lotteryId, discordId, newFee);
				updateLotteryEntries(lotteryId);
				await completeBet(interaction);
			});
		});
	});
}

async function completeBet(interaction) {
	const embed = interaction.message.embeds[0];
	const fragments = embed.description.split("**");
	embed.description = `You have successfully purchased a lottery ticket for **${fragments[1]}** for **${fragments[3]}!** 🎉`;
	embed.setFooter({ text: ' ' });
	await interaction.update({ embeds: [embed], components:[] });
}

async function rerollLottery(interaction) {
	// Check Role
	const roles = interaction.member.roles.cache;
	if (roles.has(concorde.roles.crew) || roles.has(concorde.roles.headPilot) || roles.has(concorde.roles.aircraftEngineers) || roles.has(hangar.roles.aircraftEngineers)) {
		let channel;
		const messageId	= interaction.message.embeds[0].footer.text;
		const title = interaction.message.embeds[0].title;
		const fields = interaction.message.embeds[0].fields;
		
		await interaction.reply({ content: `Enter number of winners for Reroll on **"${title}"**.`, ephemeral: true });
		const response = await interaction.channel.awaitMessages({ max: 1 });
		const { content } = response.first();
		const numberChecker = /^\d+$/;

		if (!numberChecker.test(content)) {
			await interaction.channel.send({ content: 'You entered an invalid number, honey. Why don\'t you press that Reroll button again?' });
			return;
		}

		fields.forEach(async field => {
			if (field.name === '_ _\nChannel') {
				channel = await interaction.guild.channels.cache.get(field.value.replace(/[^\d]+/gi, ''));
			}
		});

		const winnerCount = content;

		getGamblers(messageId, async users => {
			const winners = determineWinners(users, winnerCount);
			// Put winners in string
			let winnerString = '';

			if (winners.length > 0) {
				winners.forEach(winner => {
					winnerString += `<@${winner.discord_id}> `;
				});
			}
			await interaction.channel.send(`A Reroll has been requested by <@${interaction.user.id}> on **"${title}"**`);
			await channel.send(`A Reroll has been requested by <@${interaction.user.id}>. Congratulations to the new winners, ${winnerString}for winning **"${title}"** 🎉\n\n**Important Note:**\nMake sure to register a passport. Just in case you haven't, you can do that at <#915156513339891722>. *Failure to do so will disqualify you from this lottery.*`);
			// Delete Response After Sending New Winners
			response.first().delete();
		});
	}
	else {
		await interaction.reply({ content: 'You are not eligible to use this button', ephemeral: true });
		return;
	}
}

module.exports = {
	startLottery,
	scheduleLottery,
	enterLottery,
	confirmBet,
	rerollLottery
};