const { SlashCommandBuilder } = require('@discordjs/builders');
const { ChannelType } = require('discord-api-types/v9');
const ms = require('ms');
const { startGiveaway } = require('../src/utils/giveaway-handler');
const { concorde, hangar } = require('../src/utils/ids.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('giveaway')
		.setDescription('Initiate a giveaway.')
		.addStringOption(option => option.setName('title')
			.setDescription('Enter the title of the giveaway.')
			.setRequired(true))
		.addIntegerOption(option => option.setName('winners')
			.setDescription('Enter number of winners.')
			.setMinValue(1)
			.setRequired(false))
		.addStringOption(option => option.setName('duration')
			.setDescription('Enter the duration of giveaway.')
			.setRequired(false))
		.addStringOption(option => option.setName('multiplier')
			.setDescription('Set multiplier to on or off')
			.addChoices([['on', 'on'], ['off', 'off']])
			.setRequired(false))
		.addStringOption(option => option.setName('for all')
			.setDescription('Include everyone in the giveaway')
			.addChoices([['on', 'on'], ['off', 'off']])
			.setRequired(false))
		.addChannelOption(option => option.setName('channel')
			.setDescription('Enter the channel where you want to start the giveaway.')
			.addChannelType(ChannelType.GuildText)
			.setRequired(false)),
	async execute(interaction) {
		// Get Giveaway Details
		const title = interaction.options.getString('title');
        let winnerCount = interaction.options.getInteger('winners');
		let duration = interaction.options.getString('duration');
		let multiplier = interaction.options.getString('multiplier');
		let all = interaction.options.getString('all');
		let channelId = interaction.options.getChannel('channel');

		// Set default values for Giveaway Details
		if (!winnerCount) winnerCount = 1;
		if (!duration) duration = '24h';
		if (!multiplier) multiplier = 'off';
		if (!all) all = 'off';
		if (!channelId) channelId = hangar.channels.barbaraTest;
		else channelId = channelId.id;

		// Check for valid Duration
		const validDuration = /^\d+(s|m|h|d)$/;
		if (!validDuration.test(duration)) {
			await interaction.reply({ content: 'You entered an invalid duration' });
			return;
		}

		const endsOn = new Date(Date.now() + ms(duration));

		// Gather all Giveaway Details
		const details = { title, winnerCount, duration, endsOn, multiplier, all, channelId };
		// Confirm Giveaway
		await startGiveaway(interaction, details);
	},
};