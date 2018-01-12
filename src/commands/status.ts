/**
 * @module Commands
 */
/**
 * ignore
 */
import * as Discord from 'discord.js';
import {genEmbed} from "../utils";

export function status(message: Discord.Message) {
	const embed = genEmbed('PvP Hub Bot', 'PvP Hub Bot Status');
	embed
		.addField('//TODO', 'Add some stuff here.');
	return message.reply({embed});

}
