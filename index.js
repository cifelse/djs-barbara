// Get requirements for bot to work
const fs = require('fs');
const { Client, Collection, Intents, MessageActionRow } = require('discord.js');
const { token } = require('./config.json');
const handleError = require('./src/utils/error-handling');
const { presentQueue } = require('./src/queue-system');
const { enterGiveaway, scheduleGiveaway, reroll } = require('./src/utils/giveaway-handler');
const { getGiveaways } = require('./src/database/giveaway-db');
const { CronJob } = require('cron');
const ids = require('./src/utils/ids.json');
const ms = require('ms');
const discordModals = require('discord-modals');
const { submitBid, scheduleAuction } = require('./src/utils/auction-handler');
const { checkMiles, updateBid, getAuctions, updateEndTime, addToBidHistory } = require('./src/database/auction-db');
const { enterLottery, scheduleLottery, confirmBet } = require('./src/utils/lottery-handler');
const { getLotteries } = require('./src/database/lottery-db');
const { Modal, TextInputComponent, showModal } = discordModals;

// Create client instance
const client = new Client({ intents: [
	Intents.FLAGS.GUILDS,
	Intents.FLAGS.GUILD_MESSAGES,
	Intents.FLAGS.GUILD_VOICE_STATES,
] });

discordModals(client);

client.commands = new Collection();
client.auctionSchedules = [];

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	// Get file
	const command = require(`./commands/${file}`);
	// Get command from file and add to collection
	client.commands.set(command.data.name, command);
}

// When client is ready, run code below
client.once('ready', async bot => {
	console.log(`Barbara: I'm Ready! Logged in as ${bot.user.tag}`);
	bot.user.setPresence({ activities: [{ name: 'Concorde Chill Bar', type:'LISTENING' }] });
	
	// Schedule Giveaways, Auctions and Lotteries
	getGiveaways(giveaways => scheduleGiveaway(client, giveaways));
	getAuctions(auctions => scheduleAuction(client, auctions));
	getLotteries(lotteries => scheduleLottery(client, lotteries));

	disableRerolls.start();
	gm.start();
});

client.on('interactionCreate', async interaction => {
	if (interaction.isCommand()) {
		const command = client.commands.get(interaction.commandName);
		if (!command) return;
		
		try {
			await command.execute(interaction, client);
		}
		catch (error) {
			const handledError = handleError(error);
			await interaction.channel.send({ embeds: [handledError] });
		}
	}
	if (interaction.isButton()) {
		if (interaction.customId === 'first' || interaction.customId === 'back' || interaction.customId === 'next' || interaction.customId === 'last') {
			const editedQueue = presentQueue(interaction.guildId, interaction.customId);
			if (!editedQueue.title) interaction.update({ embeds:[editedQueue], components: [] });
			else interaction.update({ embeds:[editedQueue] });
		}
		if (interaction.customId === 'enter') {
			enterGiveaway(interaction);
		}
		if (interaction.customId === 'reroll') {
			await reroll(interaction);
		}
		if (interaction.customId === 'bid') {
			const modal = new Modal()
                .setCustomId('bid')
                .setTitle('Welcome to the Auction')
                .addComponents([
                new TextInputComponent()
                    .setCustomId('bid-input')
                    .setLabel('Enter MILES')
                    .setStyle('SHORT')
                    .setMinLength(1)
                    .setMaxLength(5)
                    .setPlaceholder('Enter amount here')
                    .setRequired(true),
                ]);

            showModal(modal, { client, interaction });
		}
		if (interaction.customId === 'bet') {
			confirmBet(interaction);
		}
		if (interaction.customId === 'confirmBet') {
			enterLottery(interaction);
		}
	}
});

client.on('modalSubmit', async (modal) => {
    if (modal.customId === 'bid') {
		// Get necessary data
		await modal.deferReply({ ephemeral: true });
        const user = modal.user;
		const auctionId = modal.message.id;
		let bid = modal.getTextInputValue('bid-input');

		// If the response is valid
		if (/^\d+$/.test(bid)) {
			bid = parseInt(bid);
			if (bid % 50 !== 0) {
				await modal.followUp({ content: `Invalid Input. Next Bids should be by 50s (ex. 200, 250, 300, 350, 400, ...)`, ephemeral: true });
				return;
			}
			const embed = modal.message.embeds[0];
			let value, invalidAmount;
			embed.fields.forEach(field => {
				if (field.name === '_ _\nMinimum Bid') {
					value = field.value.replace(/[^\d]+/gi, '');
					if (bid < parseInt(value)) invalidAmount = true;
				}
				if (field.name === '_ _\nBid') {
					// Get Current Bid Value
					value = field.value.replace(/[^\d]+/gi, '');
					// Check Amount if Less than Current Bid Value
					if (bid <= parseInt(value)) invalidAmount = true;
				}
			});
			if (invalidAmount) {
				await modal.followUp({ content: `Bid should be more than ${value} MILES.`, ephemeral: true });
				return;
			}
			checkMiles(user.id, async userData => {
				let fields, spliceValue;

				if (userData.miles < bid) {
					await modal.followUp({ content: `You do not have enough to bid ${bid} MILES.`, ephemeral: true });
					return;
				}

				// Get Necessary data for auction
				const auction = client.auctionSchedules.find(auction => auction.title === embed.title);
				const endDate = Date.parse(auction.endDate);
				const dateDifference = Math.abs(endDate - Date.now());
				const minutes = Math.round(dateDifference / 60000);

				// Reschedule Bidding if duration is less than or equal 10 minutes
				if (minutes <= 10) {
					const newEndDate = new Date(endDate + ms('10s'));
					auction.endDate = newEndDate;
					auction.reschedule(newEndDate);
					updateEndTime(auctionId, newEndDate);
					spliceValue = 0;
					fields = [
						{
							name: '_ _\nDuration',
							value: `<t:${Math.floor(newEndDate.getTime() / 1000)}:R>`,
							inline: true,
						},
						{
							name: '_ _\nHighest Bidder',
							value: `${modal.user}`,
							inline: true,
						},
						{
							name: '_ _\nBid',
							value: `${bid} MILES`,
							inline: true,
						},
					];
				}
				else {
					spliceValue = 1;
					fields = [
						{
							name: '_ _\nHighest Bidder',
							value: `${modal.user}`,
							inline: true,
						},
						{
							name: '_ _\nBid',
							value: `${bid} MILES`,
							inline: true,
						},
					];
				}
				// Update Bid Message
				embed.fields.splice(spliceValue, embed.fields.length, fields);
				modal.message.edit({ embeds: [embed] });
				updateBid(auctionId, user, bid);
				addToBidHistory(auctionId, user.id, bid);
				await modal.followUp({ content: `You have successfully bidded ${bid} MILES.`, ephemeral: true });
			});
		}
		// If the response is invalid
		else {
			await modal.followUp({ content: 'You entered an invalid amount.', ephemeral: true });
		}
    }
});

// Schedule Message
const gm = new CronJob('0 0 11/22 * * *', () => {
	const gmChannel = client.guilds.cache.get(ids.concorde.guildID).channels.cache.get('909300632207364146');
	if (!gmChannel) return;
	gmChannel.send('GM GN, Why don\'t you all hang with me at the <#929794847198564354>?');
});

const disableRerolls = new CronJob('0 */30 * * * *', async () => {
	// Get guild and channel
	const guild = client.guilds.cache.get(ids.concorde.guildID);
	if (!guild) return;
	const giveawayLogs = guild.channels.cache.get(ids.concorde.channels.serverLogs);
	if (!giveawayLogs) return;
	// Check Messages for Reroll Buttons
	const fetchedMessages = await giveawayLogs.messages.fetch({ limit: 100 });
	fetchedMessages.forEach(async message => {
		// Get embeds and buttons
		const embed = message.embeds[0];
		const buttons = message.components[0];
		if (!embed || !buttons) return;
		const button = buttons.components[0];
		if (button.disabled) return;
		// Disable button if 1 hour has passed of end date
		const endTime = embed.timestamp + ms('1d');
		const currentTime = new Date().getTime();
		if (currentTime <= endTime) return;
		button.setDisabled(true);
		const disabledRow = new MessageActionRow();
		disabledRow.addComponents(button);
		await message.edit({ components: [disabledRow] });
		console.log('Barbara: I disabled the Reroll button!');
	});
});

// Error Handling
client.on('error', error => {
	console.error('Barbara encountered an error:', error);
});

client.on('shardError', error => {
	console.error('Barbara encountered a websocket connection error:', error);
});

process.on('unhandledRejection', error => {
	console.error('Barbara encountered an unhandled promise rejection:', error);
});

client.login(token);