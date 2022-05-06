import { SlashCommandBuilder } from '@discordjs/builders';
import { ChannelType } from 'discord-api-types/v10';
import { convertDateToTimestamp } from '../handlers/date-handler.js';
import { startAuction } from '../handlers/auction-handler.js';
import ms from 'ms';
import { keys } from '../utils/keys.js';

const { roles: { admin: { captain, crew }, ram: { engineers } } } = keys.concorde;

export const data = new SlashCommandBuilder()
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
		.addChannelTypes(ChannelType.GuildText)
		.setRequired(false));
		
export const execute = async (interaction, client) => {
	// Role Checker
	const eligible = interaction.member.roles.cache.hasAny(captain, crew, engineers, keys.hangar.roles.engineers);
	if (!eligible) {
		await interaction.reply('You are not eligible to use this command');
		return;
	}

	const title = interaction.options.getString('title');
	let minimum_bid = interaction.options.getInteger('minimum-bid');
	let duration = interaction.options.getString('duration');
	let channel_id = interaction.options.getChannel('channel');

	// Set Default Values
	if (!minimum_bid) minimum_bid = 200;
	if (!duration) duration = '24h';
	if (!channel_id) channel_id = keys.concorde.channels.auction;
	else channel_id = channel_id.id;

	// Check for valid Duration
	duration = duration.toLowerCase();
	const validDuration = /^\d+(s|m|h|d)$/;
	if (!validDuration.test(duration)) {
		await interaction.reply({ content: 'You entered an invalid duration' });
		return;
	}

	// Check for apostrophe in Title and make Title ALL CAPS
	let modifiedTitle = title;
	for (let i = 0; i < title.length; i++) {
		if (title[i] === '\'') {
			modifiedTitle = title.slice(0, i) + '\'' + title.slice(i);
		}
	}
	modifiedTitle = modifiedTitle.toUpperCase();

	// Get Dates
	let start_date = convertDateToTimestamp(new Date());
	let end_date = new Date(Date.now() + ms(duration));
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