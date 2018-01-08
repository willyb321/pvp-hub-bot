/**
 * @module Commands
 */
/**
 * ignore
 */
import * as Discord from 'discord.js';
import {config} from "../utils";

export function help(message: Discord.Message) {
	const embed = new Discord.RichEmbed();
	embed
		.setTitle('PVP Hub Bot')
		.setAuthor('PVP Hub Bot', 'https://willb.info/i/face45a7d6378b600bda26bf69e531d7')
		.setDescription('Commands help')
		.setFooter('By Willyb321', 'https://willb.info/i/22f73495510de53cb95cba9615549bc9')
		.setTimestamp()
		.addField('?reg[ister]', 'Register yourself.')
		.addField('?new', 'New session.')
		.addField('?restart', 'Restart the bot.');
	return message.reply({embed});

}
