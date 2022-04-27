const { SlashCommandBuilder } = require('@discordjs/builders');
const { concorde, hangar } = require('../src/utils/ids.json');
const ms = require('ms');
const { startAuction } = require('../src/utils/auction-handler');
const { ChannelType } = require('discord-api-types/v10');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('auction')
		.setDescription('Initiate an auction')
		.addStringOption(option => option.setName('title')
			.setDescription('Enter the title of the auction.')
			.setRequired(true))
		.addIntegerOption(option => option.setName('minimum-bid')
			.setDescription('Enter number of minimum bid.')
			.setMinValue(200)
			.setRequired(false))
		.addStringOption(option => option.setName('duration')
		.setDescription('Enter duration of auction.')
		.setRequired(false))
		.addChannelOption(option => option.setName('channel')
			.setDescription('Enter the channel where you want to start the giveaway.')
			.addChannelType(ChannelType.GuildText)
			.setRequired(false)),
	async execute(interaction, client) {
		// Role Checker
		const roles = interaction.member.roles.cache;
		if (roles.has(concorde.roles.crew) || roles.has(concorde.roles.headPilot) || roles.has(concorde.roles.aircraftEngineers) || roles.has(hangar.roles.aircraftEngineers)) {
			const title = interaction.options.getString('title');
			let minimum_bid = interaction.options.getInteger('minimum-bid');
			let duration = interaction.options.getString('duration');
			let channel_id = interaction.options.getChannel('channel');
			// Set Default Values
			if (!minimum_bid) minimum_bid = 200;
			if (!duration) duration = '24h';
			if (!channel_id) channel_id = concorde.channels.auctions;
			else channel_id = channel_id.id;

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
			
			let start_date = new Date(Date.now());
			let end_date = new Date(Date.now() + ms(duration));
			start_date = convertDateToTimestamp(start_date);
			end_date = convertDateToTimestamp(end_date);

			// Gather all Auction Details
			const details = { 
				title: modifiedTitle,
				minimum_bid,
				start_date,
				end_date,
				channel_id
			};

			startAuction(interaction, details, client);
		}
		else {
			await interaction.reply('You are not eligible to use this command');
		}
	},
};