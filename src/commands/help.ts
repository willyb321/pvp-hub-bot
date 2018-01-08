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
		.addField('?unreg[ister]', 'Unregister yourself.')
		.addField('?new', 'New session.')
		.addField('?restart', '[Mod] Restart the bot.')
		.addField('?remove [@user]', '[Mod] Remove a user if they are AFK');
	return message.reply({embed});

}
