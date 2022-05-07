// Get requirements for bot to work
import { Client, Collection, Intents } from 'discord.js';
import 'dotenv/config';
// Utilities
import { readdirSync } from 'fs';
import discordModals from 'discord-modals';
// Giveaway
import { scheduleGiveaway } from './src/handlers/giveaway-handler.js';
import { getGiveaways } from './src/database/giveaway-db.js';
// Auction
import { scheduleAuction } from './src/handlers/auction-handler.js';
import { getAuctions } from './src/database/auction-db.js';
// Lottery
import { scheduleLottery } from './src/handlers/lottery-handler.js';
import { getLotteries } from './src/database/lottery-db.js';
// Handlers
import { startJobs } from './src/handlers/job-handler.js';
import { buttonHandler } from './src/handlers/button-handler.js';
import { modalHandler } from './src/handlers/modal-handler.js';

import { keys } from './src/utils/keys.js';
const { concorde } = keys;

// Create client instance
const client = new Client({ intents: [
	Intents.FLAGS.GUILDS,
	Intents.FLAGS.GUILD_MEMBERS,
	Intents.FLAGS.GUILD_MESSAGES,
	Intents.FLAGS.GUILD_VOICE_STATES,
] });

discordModals(client);

client.commands = new Collection();
client.auctionSchedules = [];

const commandFiles = readdirSync('./src/commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	// Get file
	const command = await import(`./src/commands/${file}`);
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

	// Get Guild
	const guild = await client.guilds.fetch(concorde.id);
	if (!guild) {
		console.log('Barbara: I can\'t find the guild. Double check the Guild ID.');
		return;
	}
	startJobs(guild);
});

client.on('interactionCreate', async interaction => {
	if (interaction.isCommand()) {
		const command = client.commands.get(interaction.commandName);
		if (!command) return;

		try { await command.execute(interaction, client) } 
		catch (error) { console.error(error) }
	}
	if (interaction.isButton()) {
		try { await buttonHandler(interaction, client); }
		catch (error) { console.error(error); }
	}
});

client.on('modalSubmit', async (modal) => {
    try { await modalHandler(client, modal); }
	catch (error) { console.error(error); }
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

client.login(process.env.TOKEN);