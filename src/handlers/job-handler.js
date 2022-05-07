import { CronJob } from "cron";
import ms from "ms";
import { keys } from "../utils/keys.js";

const { channels } = keys.concorde;

export const startJobs = (guild) => {
	// Schedule GM Message
	new CronJob('0 0 11/22 * * *', () => {
		const gmChannel = guild.channels.cache.get(channels.gm);
		if (!gmChannel) return;
		gmChannel.send('GM GN, Why don\'t you all hang with me at the <#929794847198564354>?');
	}).start();

	new CronJob('0 */30 * * * *', async () => {
		const giveawayLogs = guild.channels.cache.get(channels.logs.giveawayLogs);
		if (!giveawayLogs) return;

		// Check Messages for Reroll Buttons
		const fetchedMessages = await giveawayLogs.messages.fetch({ limit: 100 });
		fetchedMessages.forEach(async message => {
			// Get embeds and buttons
			const embed = message.embeds[0];
			const buttons = message.components[0];
			if (!embed || !buttons) return;
			const button = buttons.components[0];
			if (button.disabled) return;
			
			// Disable button if 1 hour has passed of end date
			const endTime = embed.timestamp + ms('1d');
			const currentTime = new Date().getTime();
			if (currentTime <= endTime) return;
			button.setDisabled(true);
			const disabledRow = new MessageActionRow();
			disabledRow.addComponents(button);
			await message.edit({ components: [disabledRow] });
			console.log('Barbara: I disabled the Reroll button!');
		});
	}).start();
}

