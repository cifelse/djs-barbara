const { SlashCommandBuilder } = require('@discordjs/builders');
const { ChannelType } = require('discord-api-types/v9');
const ms = require('ms');
const { concorde, hangar } = require('../src/utils/ids.json');
const { startLottery } = require('../src/utils/lottery-handler');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lottery')
		.setDescription('Initiate a lottery.')
		.addStringOption(option => option.setName('title')
			.setDescription('Enter the title of the lottery.')
			.setRequired(true))
		.addIntegerOption(option => option.setName('winners')
			.setDescription('Enter number of winners.')
			.setMinValue(1)
			.setRequired(false))
		.addStringOption(option => option.setName('duration')
			.setDescription('Enter the duration of lottery.')
			.setRequired(false))
		.addIntegerOption(option => option.setName('price')
			.setDescription('Enter the price of a lottery ticket.')
			.setMinValue(1)
			.setRequired(false))
		.addIntegerOption(option => option.setName('max')
			.setDescription('Enter the number of possible tickets that you can buy.')
			.setMinValue(1)
			.setRequired(false))
		.addStringOption(option => option.setName('free-for-all')
			.setDescription('Include everyone in the lottery')
			.addChoices([['on', 'on'], ['off', 'off']])
			.setRequired(false))
		.addChannelOption(option => option.setName('channel')
			.setDescription('Enter the channel where you want to start the lottery.')
			.addChannelType(ChannelType.GuildText)
			.setRequired(false)),
	async execute(interaction, client) {
		// Check Role
		const roles = interaction.member.roles.cache;
		if (roles.has(concorde.roles.crew) || roles.has(concorde.roles.headPilot) || roles.has(concorde.roles.aircraftEngineers) || roles.has(hangar.roles.aircraftEngineers)) {
			// Get Giveaway Details
			const title = interaction.options.getString('title');
			let winnerCount = interaction.options.getInteger('winners');
			let duration = interaction.options.getString('duration');
			let price = interaction.options.getInteger('price');
			let max_tickets = interaction.options.getInteger('max');
			let all = interaction.options.getString('free-for-all');
			let channelId = interaction.options.getChannel('channel');

			// Set default values for Giveaway Details
			if (!winnerCount) winnerCount = 1;
			if (!duration) duration = '24h';
			if (!price) price = 50;
			if (!max_tickets) max_tickets = 1;
			if (!all) all = 'off';
			if (!channelId) channelId = hangar.channels.barbaraTest;
			else channelId = channelId.id;

			// Check for valid Duration
			duration = duration.toLowerCase();
			const validDuration = /^\d+(s|m|h|d)$/;
			if (!validDuration.test(duration)) {
				await interaction.reply({ content: 'You entered an invalid duration' });
				return;
			}

			// Check for apostrophe in Title and make it ALL CAPS
			let modifiedTitle = title;
			for (let i = 0; i < title.length; i++) {
				if (title[i] === '\'') {
					modifiedTitle = title.slice(0, i) + '\'' + title.slice(i);
				}
			}
			modifiedTitle = modifiedTitle.toUpperCase();

			const start_date = new Date(Date.now());
			const end_date = new Date(Date.now() + ms(duration));

			// Gather all Giveaway Details
			const details = { 
				title : modifiedTitle, 
				num_winners: winnerCount,
				price,
				max_tickets,
				start_date,
				end_date,
				strict_mode: all, 
				channel_id: channelId,
			};

			// Confirm Giveaway
			await startLottery(interaction, details, client);
		}
		else {
			await interaction.reply({ content: 'You are not eligible to use this command', ephemeral: true });
			return;
		}
	},
};