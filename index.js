// Get requirements for bot to work
const fs = require('fs');
const { Client, Collection, Intents } = require('discord.js');
const { token } = require('./config.json');
const handleError = require('./src/utils/error-handling');
const { presentQueue } = require('./src/queue-system');
const { enterGiveaway } = require('./src/utils/giveaway-handler');

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
client.once('ready', c => {
	console.log(`Barbara: I'm Ready! Logged in as ${c.user.tag}`);
	c.user.setPresence({ activities: [{ name: 'Concorde Chill Bar', type:'LISTENING' }] });
});

client.on('interactionCreate', async interaction => {
	if (interaction.isCommand()) {
		const command = client.commands.get(interaction.commandName);
		if (!command) return;
	
		try {
			await command.execute(interaction);
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
	}
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