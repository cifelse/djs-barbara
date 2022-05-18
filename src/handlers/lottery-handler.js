import { MessageButton, MessageActionRow } from 'discord.js';
import { scheduleJob } from 'node-schedule';
import { saveLottery, getLotteryEntries, getGamblers, updateLotteryEntries, checkMaxTicketsAndEntries, getDataForBet, getStrictMode, insertLotteryEntry, getLotteries, insertLotteryWinner } from '../database/lottery-db.js';
import { announceLotteryWinners, editLotteryLog, lotteryEmbed, lotteryLogsEmbed } from '../utils/embeds/lottery-embeds.js';
import { CronJob } from 'cron';
import { keys } from '../utils/keys.js';
import { updateMilesBurned, checkMiles, removeMiles } from '../database/miles-db.js';
import { determineWinners } from '../utils/entertainment.js';

const { roles: { levels: { frequentFlyers, premiumEconomy, businessClass, jetsetters } }, channels: { logs: { lotteryLogs } } } = keys.concorde;

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
	const logsEmbed = lotteryLogsEmbed(embed, message, details);
	const logsChannel = interaction.guild.channels.cache.get(lotteryLogs);
	await logsChannel.send({ embeds: [logsEmbed] });
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

		// Check if the Lottery is Free For All 
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
				updateMilesBurned(newFee, 'lotteries');
				await completeBet(interaction);
			});
		});
	});
}

export const completeBet = async (interaction) => {
	// Get and edit Embed
	const discordId = interaction.user.id;
	const embed = interaction.message.embeds[0];
	const fragments = embed.description.split("**");
	
	// Get Balance after Betting
	checkMiles(discordId, async user => {
		embed.description = `You have successfully purchased a lottery ticket for **${fragments[1]}** for **${fragments[3]}!** 🎉\n**Current Balance: ${user.miles} MILES**`;
		embed.setFooter({ text: ' ' });
		await interaction.update({ embeds: [embed], components:[] });
	});
	
}