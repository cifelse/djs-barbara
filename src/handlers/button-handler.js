import { presentQueue } from '../utils/player/queue-system.js';
import { enterGiveaway, rerollGiveaway } from './giveaway-handler.js';
import { confirmBet, enterLottery } from './lottery-handler.js';
import discordModals from 'discord-modals';

const { Modal, TextInputComponent, showModal } = discordModals;

export const buttonHandler = async (interaction, client) => {
	if (interaction.customId === 'first' || interaction.customId === 'back' || interaction.customId === 'next' || interaction.customId === 'last') {
		const editedQueue = presentQueue(interaction.guildId, interaction.customId);
		if (!editedQueue.title) await interaction.update({ embeds:[editedQueue], components: [] });
		else await interaction.update({ embeds:[editedQueue] });
	}

	if (interaction.customId === 'enter') {
		await enterGiveaway(interaction);
	}

	if (interaction.customId === 'reroll-giveaway') {
		await rerollGiveaway(interaction);
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
		await confirmBet(interaction);
	}

	if (interaction.customId === 'confirmBet') {
		await enterLottery(interaction);
	}
}