export const buttonHandler = async (interaction, client) => {
	if (interaction.customId === 'first' || interaction.customId === 'back' || interaction.customId === 'next' || interaction.customId === 'last') {
		const editedQueue = presentQueue(interaction.guildId, interaction.customId);
		if (!editedQueue.title) interaction.update({ embeds:[editedQueue], components: [] });
		else interaction.update({ embeds:[editedQueue] });
	}
	if (interaction.customId === 'enter') {
		enterGiveaway(interaction);
	}
	if (interaction.customId === 'reroll') {
		await reroll(interaction);
	}
	if (interaction.customId === 'bid') {
		const modal = new Modal()
			.setCustomId('bid')
			.setTitle('Welcome to the Auction')
			.addComponents([
			new TextInputComponent()
				.setCustomId('bid-input')
				.setLabel('Enter MILES')
				.setStyle('SHORT')
				.setMinLength(1)
				.setMaxLength(5)
				.setPlaceholder('Enter amount here')
				.setRequired(true),
			]);

		showModal(modal, { client, interaction });
	}
	if (interaction.customId === 'bet') {
		confirmBet(interaction);
	}
	if (interaction.customId === 'confirmBet') {
		enterLottery(interaction);
	}
	if (interaction.customId === 'force-end') {
		console.log(interaction.message.embeds[0]);
	}
}