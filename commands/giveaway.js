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
		.addStringOption(option => option.setName('free-for-all')
			.setDescription('Include everyone in the giveaway')
			.addChoices([['on', 'on'], ['off', 'off']])
			.setRequired(false))
		.addChannelOption(option => option.setName('channel')
			.setDescription('Enter the channel where you want to start the giveaway.')
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
			let multiplier = interaction.options.getString('multiplier');
			let all = interaction.options.getString('free-for-all');
			let channelId = interaction.options.getChannel('channel');

			// Set default values for Giveaway Details
			if (!winnerCount) winnerCount = 1;
			if (!duration) duration = '24h';
			if (!multiplier) multiplier = 'off';
			if (!all) all = 'off';
			if (!channelId) channelId = concorde.channels.giveaway;
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

			const end_date = new Date(Date.now() + ms(duration));
			// Gather all Giveaway Details
			const details = { 
				title : modifiedTitle, 
				num_winners: winnerCount, 
				duration,
				multiplier,
				end_date,
				strict_mode: all, 
				channel_id: channelId,
			};

			// Confirm Giveaway
			await startGiveaway(interaction, details, client);
		}
		else {
			await interaction.reply('You are not eligible to use this command');
			return;
		}
	},
};