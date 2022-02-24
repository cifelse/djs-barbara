// Get requirements for bot to work
const fs = require('fs');
const { Client, Collection, Intents, MessageActionRow } = require('discord.js');
const { token } = require('./config.json');
const handleError = require('./src/utils/error-handling');
const { presentQueue } = require('./src/queue-system');
const { enterGiveaway, scheduleGiveaway, reroll } = require('./src/utils/giveaway-handler');
const { getGiveaways } = require('./src/database/database-handler');
const { CronJob } = require('cron');
const ids = require('./src/utils/ids.json');
const ms = require('ms');

// Create client instance
const client = new Client({ intents: [
	Intents.FLAGS.GUILDS,
	Intents.FLAGS.GUILD_MESSAGES,
	Intents.FLAGS.GUILD_VOICE_STATES,
] });

client.commands = new Collection();
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
	
	getGiveaways((giveaways) => {
		scheduleGiveaway(client, giveaways);
	});
	disableRerolls.start();
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
	}
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