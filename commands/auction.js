const { SlashCommandBuilder } = require('@discordjs/builders');
const { editEmbed } = require('../src/utils/embeds');
const { concorde, hangar } = require('../src/utils/ids.json');
const ms = require('ms');
const { startAuction } = require('../src/utils/auction-handler');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('auction')
		.setDescription('Initiate an auction')
		.addStringOption(option => option.setName('title')
			.setDescription('Enter the title of the auction.')
			.setRequired(true))
		.addIntegerOption(option => option.setName('minimum-bid')
			.setDescription('Enter number of minimum bid.')
			.setMinValue(500)
			.setRequired(false))
		.addStringOption(option => option.setName('duration')
		.setDescription('Enter duration of auction.')
		.setRequired(false)),
	async execute(interaction, client) {
		// Role Checker
		const roles = interaction.member.roles.cache;
		if (roles.has(concorde.roles.crew) || roles.has(concorde.roles.headPilot) || roles.has(hangar.roles.aircraftEngineers)) {
			const title = interaction.options.getString('title');
			let minBid = interaction.options.getInteger('minimum-bid');
			let duration = interaction.options.getString('duration');
			
			// Set Default Values
			if (!minBid) minBid = 500;
			if (!duration) duration = '24h';

			// Check for valid Duration
			duration = duration.toLowerCase();
			const validDuration = /^\d+(s|m|h|d)$/;
			if (!validDuration.test(duration)) {
				await interaction.reply({ content: 'You entered an invalid duration' });
				return;
			}

			const endDate = new Date(Date.now() + ms(duration));

			// Gather all Auction Details
			const details = { 
				title,
				minBid,
				duration,
				endDate,
			};

			startAuction(interaction, details, client);
		}
		else {
			await interaction.reply('You are not eligible to use this command');
		}
	},
};