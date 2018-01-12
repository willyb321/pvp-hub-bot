/**
 * @module Commands
 */
/**
 * ignore
 */
import * as Discord from 'discord.js';
import {genEmbed} from '../utils';

export function help(message: Discord.Message) {
	const embed = genEmbed('PVP Hub Bot', 'Commands help')
		.addField('?reg[ister]', 'Register yourself.')
		.addField('?unreg[ister]', 'Unregister yourself.')
		.addField('?who', 'See who is registered for a match.')
		.addField('?new', 'New session. Please use when finishing a match. (Mods can override)')
		.addField('?restart', '[Mod] Restart the bot.')
		.addField('?remove [@user]', '[Mod] Remove a user if they are AFK')
		.addField('?showgame [ID]', 'Show game info')
		.addField('?result [ID] [Team # (0/1)]', '[Mod] Set the result of game #[ID]. Make sure to do this otherwise you\'ll end up with team #12 winning.');
	return message.reply({embed});
}
