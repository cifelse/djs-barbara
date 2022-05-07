import { SlashCommandBuilder } from '@discordjs/builders';
import { ChannelType } from 'discord-api-types/v9';
import { convertDateToTimestamp } from '../handlers/date-handler.js';
import ms from 'ms';
import { keys } from '../utils/keys.js';
import { startLottery } from '../handlers/lottery-handler.js';

const { roles: { admin: { captain, crew }, ram: { engineers } } } = keys.concorde;

export const data = new SlashCommandBuilder()
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
	.addBooleanOption(option => option.setName('free-for-all')
		.setDescription('Include everyone in the lottery')
		.setRequired(false))
	.addChannelOption(option => option.setName('channel')
		.setDescription('Enter the channel where you want to start the lottery.')
		.addChannelTypes(ChannelType.GuildText)
		.setRequired(false));

export const execute = async (interaction, client) => {
	// Role Checker
	const eligible = interaction.member.roles.cache.hasAny(captain, crew, engineers, keys.hangar.roles.engineers);
	if (!eligible) {
		await interaction.reply('You are not eligible to use this command');
		return;
	}

	// Get Lottery Details
	const title = interaction.options.getString('title');
	let winnerCount = interaction.options.getInteger('winners');
	let duration = interaction.options.getString('duration');
	let price = interaction.options.getInteger('price');
	let max_tickets = interaction.options.getInteger('max');
	let ffa = interaction.options.getBoolean('free-for-all');
	let channelId = interaction.options.getChannel('channel');

	// Set default values for Lottery Details
	if (!winnerCount) winnerCount = 1;
	if (!duration) duration = '24h';
	if (!price) price = 50;
	if (!max_tickets) max_tickets = 1;
	if (!ffa) ffa = false;
	if (!channelId) channelId = keys.concorde.channels.lottery;
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

	let start_date = convertDateToTimestamp(new Date());
	let end_date = new Date(Date.now() + ms(duration));
	end_date = convertDateToTimestamp(end_date);

	// Gather all Lottery Details
	const details = {
		title: modifiedTitle,
		num_winners: winnerCount,
		price,
		max_tickets,
		start_date,
		end_date,
		ffa,
		channel_id: channelId,
	};

	await startLottery(interaction, details, client);
}