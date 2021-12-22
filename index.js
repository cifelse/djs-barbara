// Get requirements for bot to work
const fs = require('fs');
const { Client, Collection, Intents, MessageEmbed } = require('discord.js');
const { token } = require('./config.json');
const { editEmbed } = require('./src/utils/embeds');

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
	console.log(`Ready! Logged in as ${c.user.tag}`);
	c.user.setPresence({ activities: [{ name: 'Concorde Cafe Music.', type:'LISTENING' }] });
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	if (interaction.member.roles.cache.has('884351522023014421') || 
		interaction.member.roles.cache.has('867780196374151188') ||
		interaction.member.roles.cache.has('894436955264278558') ||
		interaction.member.roles.cache.has('917686227539464192') ||
		interaction.member.roles.cache.has('893745856719757332')) {
		
		const command = client.commands.get(interaction.commandName);
		if (!command) return;

		try {
			interaction.deferReply();
			await command.execute(interaction);
		}
		catch (error) {
			console.error('Index Error:', error);
			const embed = new MessageEmbed();
			editEmbed.error(embed);
			await interaction.followUp({ embeds: [embed] });
		}
	}
	else {
		const embed = new MessageEmbed();
		editEmbed.noRole(embed);
		await interaction.reply({ embeds: [embed] });
		return;
	}

});

client.login(token);