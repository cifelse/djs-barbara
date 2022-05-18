import { presentQueue } from '../utils/player/queue-system.js';
import { enterGiveaway } from './giveaway-handler.js';
import { confirmBet, enterLottery } from './lottery-handler.js';
import { inputBid } from './auction-handler.js';
import { rerollWinners } from '../utils/entertainment.js';

export const buttonHandler = async (interaction, client) => {
	if (interaction.customId === 'first' || interaction.customId === 'back' || interaction.customId === 'next' || interaction.customId === 'last') {
		const editedQueue = presentQueue(interaction.guildId, interaction.customId);
		if (!editedQueue.title) await interaction.update({ embeds:[editedQueue], components: [] });
		else await interaction.update({ embeds:[editedQueue] });
	}

	if (interaction.customId === 'enter-giveaway') {
		await enterGiveaway(interaction);
	}

	if (interaction.customId === 'reroll-giveaway') {
		await rerollWinners(interaction, 'giveaway');
	}

	if (interaction.customId === 'reroll-lottery') {
		await rerollWinners(interaction, 'lottery');
	}

	if (interaction.customId === 'bid') {
		inputBid(client, interaction);
	}

	if (interaction.customId === 'bet') {
		await confirmBet(interaction);
	}

	if (interaction.customId === 'confirmBet') {
		await enterLottery(interaction);
	}
}