const { MessageActionRow, MessageEmbed } = require('discord.js');

let participants = [];
let entries = 0;

	function startGiveaway(embed, giveaway, interaction) {
		embed.setColor('#80A3FF')
			.setTitle(giveaway.title)
			.setAuthor({ name: `${interaction.user.username}#${interaction.user.discriminator}`, iconURL: `${interaction.user.displayAvatarURL()}` })
			.setDescription(`Click 🍷 to enter the giveaway!\n**Duration: ${giveaway.duration}** (Ends <t:${Math.floor(giveaway.endsOn.getTime() / 1000)}:R>)\n`)
			.setFooter({ text: `Number of Winners: ${giveaway.winnerCount}` })
			.setTimestamp();

			if (giveaway.all === 'on') embed.addField('_ _\nRequirements', 'Free for All', true);
			else embed.addField('_ _\nRequirements', '<@&893745856719757332>', true);

			if (giveaway.multiplier === 'on') embed.addField('_ _\nMultipliers', '<@&893745856719757332> + 99999', true);
	}
	function enterGiveaway(interaction) {
		// Check if the participant is a bot
		if (interaction.user.bot) return;
		// Check for duplicates in participants
		let duplicate = false;
		participants.forEach(participant => {
			if (participant === interaction.user) {
				duplicate = true;
				interaction.reply({ content: 'You already participated in this giveaway.', ephemeral: true });
				return;
			}
		});
		// Add participants
		if (!duplicate) {
			participants.push(interaction.user);
			entries++;

			const newButton = interaction.message.components[0].components[0].setLabel(`🍷 ${entries}`);
			const embed = interaction.message.embeds[0];
			const row = new MessageActionRow();
			row.addComponents(newButton);
			interaction.update({ embeds:[embed], components: [row] });	
		}
	}
	function endGiveaway(interaction, message) {
		participants = [];
		entries = 0;

		const disabledButton = message.components[0].components[0].setDisabled(true);
		const newEmbed = message.embeds[0];
		newEmbed.setColor('RED');
		const newRow = new MessageActionRow();
		newRow.addComponents(disabledButton);
		message.edit({ embeds:[newEmbed], components: [newRow] });

		const endEmbed = new MessageEmbed();
		endEmbed.setTitle('the end na');
		interaction.channel.send({ embeds: [endEmbed] });
	}

module.exports = { startGiveaway, enterGiveaway, endGiveaway };