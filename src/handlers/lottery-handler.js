import { MessageButton, MessageActionRow } from 'discord.js';
import { scheduleJob } from 'node-schedule';
import { saveLottery, getLotteryEntries, getGamblers, updateLotteryEntries, checkMaxTicketsAndEntries, removeMiles, getDataForBet, getStrictMode, insertLotteryEntry, getLotteries, insertLotteryWinner } from '../database/lottery-db.js';
import { announceLotteryWinners, editLotteryLog, lotteryEmbed } from '../utils/embeds/entertainment-embeds.js';
import { CronJob } from 'cron';
import { keys } from '../utils/keys.js';
import { updateMilesBurned } from '../database/db.js';

const { roles: { admin, ram, levels: { frequentFlyers, premiumEconomy, businessClass, jetsetters } }, channels: { lottery, logs: { lotteryLogs } } } = keys.concorde;

export const startLottery = async (interaction, details, client) => {
	// Create and Send Message Embed
	const embed = lotteryEmbed(interaction, details);
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
	
	saveLottery(details, () => {
		getLotteries(lotteries => {
			const lastItem = lotteries[lotteries.length - 1];
			scheduleLottery(client, [lastItem]);
		});
	});
	await interaction.reply({ content: `Lottery successfully launched for **"${details.title}"**!` });

	// Edit embed and send to Lottery Logs
	embed.setDescription(`A lottery has started. Go to this lottery by [clicking here.](${message.url})`);
	embed.addField('_ _\nChannel', `<#${details.channel_id}>`);
	embed.setFooter({ text: `${details.lottery_id}` });
	embed.setTimestamp();
	embed.fields.forEach(field => {
		if (field.name === '_ _\nDuration') field.name = '_ _\nTime';
	});
	const logsChannel = interaction.guild.channels.cache.get(lotteryLogs);
	await logsChannel.send({ embeds: [embed] });
}

export const scheduleLottery = async (client, details) => {
	for (let i = 0; i < details.length; i++) {
		const { title, num_winners, end_date, channel_id, lottery_id } = details[i];
		
		// Check if Lottery is already finished
		const currentDate = new Date().getTime();
		if (end_date.getTime() < currentDate) continue;
		
		console.log('Barbara: Alert! I\'m Scheduling a Lottery for', title);
		
		// Get channel and message to edit and announce winners
		const channel = await client.channels.fetch(channel_id);
		let message;
		if (channel) message = await channel.messages.fetch(lottery_id);
			
		const watchEntries = new CronJob('* * * * * *', () => {
			getLotteryEntries(lottery_id, async (result) => {
				const entries = result[0].num_entries;
				const newButton = message.components[0].components[0];

				// Check for number of entries
				if (entries == newButton.label.replace(/[^\d]+/gi, '')) return;

				console.log(`Barbara: There are a total of ${entries} lottery participants now!`);

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
						insertLotteryWinner(lottery_id, winner);
					});
				}
				else {
					winnerString = 'None';
				}
				
				if (channel && message) {
					await announceLotteryWinners(channel, message, winnerString, title);
					await editLotteryLog(client, details[i], message, winnerString);						
				}
			});
		});
	}
}

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

	console.log('Barbara: I\'ve successfully chosen the Lottery winners!');
    return winners;
}

export const confirmBet = async (interaction) => {
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

export const enterLottery = async (interaction) => {
	const lotteryId = interaction.message.embeds[0].footer.text.replace(/[^\d]+/gi, '');
	const discordId = interaction.user.id;

	getStrictMode(lotteryId, async lottery => {
		const eligibleRole = interaction.member.roles.cache.hasAny(frequentFlyers, premiumEconomy, businessClass, jetsetters);
		const embed = interaction.message.embeds[0];
		embed.setFooter({ text: ' ' });

		const ffa = lottery.ffa;
		if (interaction.user.bot || (!ffa && !eligibleRole)) {
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
				updateMilesBurned(newFee, 'lottery');
				await completeBet(interaction);
			});
		});
	});
}

export const completeBet = async (interaction) => {
	const embed = interaction.message.embeds[0];
	const fragments = embed.description.split("**");
	embed.description = `You have successfully purchased a lottery ticket for **${fragments[1]}** for **${fragments[3]}!** 🎉`;
	embed.setFooter({ text: ' ' });
	await interaction.update({ embeds: [embed], components:[] });
}

export const rerollLottery = async (interaction) => {
	// Check Role
	const eligible = interaction.member.roles.cache.hasAny(admin.captain, admin.crew, ram.engineers, keys.hangar.roles.engineers);
	if (!eligible) {
		await interaction.reply({ content: 'You are not eligible to use this button', ephemeral: true });
		return;
	}
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

	let channel;
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
				insertLotteryWinner(messageId, winner);
			});
		}
		await interaction.channel.send(`A Reroll has been requested by <@${interaction.user.id}> on **"${title}"**`);
		await channel.send(`A Reroll has been requested by <@${interaction.user.id}>. Congratulations to the new winners, ${winnerString}for winning **"${title}"** 🎉\n\n**Important Note:**\nMake sure to register a passport. Just in case you haven't, you can do that at <#915156513339891722>. *Failure to do so will disqualify you from this lottery.*`);
		// Delete Response After Sending New Winners
		response.first().delete();
	});
}