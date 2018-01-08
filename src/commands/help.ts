/**
 * @module Commands
 */
/**
 * ignore
 */
import * as Discord from 'discord.js';
import {config, genEmbed} from "../utils";

export function help(message: Discord.Message) {
	const embed = genEmbed('PVP Hub Bot', 'Commands help')
		.addField('?reg[ister]', 'Register yourself.')
		.addField('?unreg[ister]', 'Unregister yourself.')
		.addField('?new', 'New session. Please use when finishing a match. (Mods can override)')
		.addField('?restart', '[Mod] Restart the bot.')
		.addField('?remove [@user]', '[Mod] Remove a user if they are AFK');
	return message.reply({embed});

}
