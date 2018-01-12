/**
 * @module Commands
 */
/**
 * ignore
 */
import {currentStatus, genEmbed} from '../utils';
import * as Discord from 'discord.js';

export function who(message: Discord.Message) {
	if (!currentStatus.currentUsers.has(message.channel.id)) {
		currentStatus.currentUsers.set(message.channel.id, []);
	}
	const embed = genEmbed('Current Queue:', `${currentStatus.currentUsers.get(message.channel.id).join('\n')}`);
	if (!currentStatus.currentUsers.has(message.channel.id) || currentStatus.currentUsers.get(message.channel.id).length === 0) {
		return message.channel.send(`Nobody currently registered for ${message.channel.toString()}.`);
	}
	return message.channel.send({embed});
}
