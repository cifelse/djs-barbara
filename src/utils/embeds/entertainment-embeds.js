import { convertTimestampToDate } from "../../handlers/date-handler";

export const giveawayEmbed = (interaction, giveawayDetails) => {
	const giveawayEmbed = new MessageEmbed();
	const scheduledEndDate = convertTimestampToDate(giveawayDetails.end_date);
	const ffa = giveawayDetails.ffa.toString();
	const multiplier = giveawayDetails.multiplier.toString();

	giveawayEmbed.setColor('#80A3FF')
	.setTitle(giveawayDetails.title)
	.setAuthor({ name: `${interaction.user.username}#${interaction.user.discriminator}`, iconURL: `${interaction.user.displayAvatarURL()}` })
	.setDescription('You know what it is, **Click** 🍷 **to enter the giveaway!**\n')
	.addFields(
		{ name: '_ _\nDuration', value: `<t:${Math.floor(scheduledEndDate.getTime() / 1000)}:R>`, inline: true },
		{ name: '_ _\nWinner/s', value: `${giveawayDetails.num_winners}`, inline: true },
	);

	if (ffa == 1) giveawayEmbed.addField('_ _\nRequirement', 'Free for All');
	else giveawayEmbed.addField('_ _\nRequirement', `At least be <@&${concorde.roles.frequentFlyer}> (Level 10)`);

	if (multiplier == 1) giveawayEmbed.addField('_ _\nMultipliers', `<@&${concorde.roles.multiplier.jetsetters}> + 4\n<@&${concorde.roles.multiplier.businessClass}> + 3\n<@&${concorde.roles.multiplier.premiumEcon}> + 2`);
	
	return giveawayEmbed;
}

export const auctionEmbed = (details) => {
	const scheduledEndDate = convertTimestampToDate(details.end_date);
	return {
		title: `${details.title}`,
		description: '**You may now use MILES to gain whitelist spots** from projects you have been eyeing for a long time that happens to be Partners of Concorde also! Bid by pressing the Bid button below.',
		fields: [
			{
				name: '_ _\nDuration',
				value: `<t:${Math.floor(scheduledEndDate.getTime() / 1000)}:R>`,
				inline: true,
			},
			{
				name: '_ _\nMinimum Bid',
				value: `${details.minimum_bid}`,
				inline: true,
			},
		],
		color: 'f1f10b',
	};
}

export const lotteryEmbed = (interaction, lotteryDetails) => {
	const lotteryEmbed = new MessageEmbed();
	const scheduledEndDate = convertTimestampToDate(lotteryDetails.end_date);
	const ffa = lotteryDetails.ffa.toString();
	lotteryEmbed.setColor('#80A3FF')
	.setTitle(lotteryDetails.title)
	.setAuthor({ name: `${interaction.user.username}#${interaction.user.discriminator}`, iconURL: `${interaction.user.displayAvatarURL()}` })
	.setDescription('**You can now use your MILES to enter the lotteries in Concorde!** Unlike the Auctions, everyone is able to win the Whitelist Spots fairly.\n\n **Click 🎫 to enter the lottery!**')
	.addFields(
		{ name: '_ _\nDuration', value: `<t:${Math.floor(scheduledEndDate.getTime() / 1000)}:R>`, inline: true },
		{ name: '_ _\nWinner/s', value: `${lotteryDetails.num_winners}`, inline: true },
		{ name: '_ _\nMax Tickets', value: `${lotteryDetails.max_tickets}`, inline: true },
		{ name: '_ _\nPrice of a Single Ticket', value: `For this lottery, a single ticket costs **${lotteryDetails.price} MILES.**`, inline: false },
	);

	if (ffa == 1) lotteryEmbed.addField('_ _\nRequirement', 'Free for All');
	else lotteryEmbed.addField('_ _\nRequirement', `At least be <@&${concorde.roles.frequentFlyer}> (Level 10)`);
	
	return lotteryEmbed;
}