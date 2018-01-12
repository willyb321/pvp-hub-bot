/**
 * @module Commands
 */
/**
 * ignore
 */
import {currentStatus, genEmbed} from '../utils';
import * as Discord from 'discord.js';

export function who(message: Discord.Message) {
	const usernames = [];
	if (!currentStatus.currentUsers[message.channel.id]) {
		currentStatus.currentUsers[message.channel.id] = [];
	}
	const embed = genEmbed('Current Queue:', `${currentStatus.currentUsers[message.channel.id].join('\n')}`);
	if (currentStatus.currentUsers[message.channel.id].length === 0) {
		message.channel.send(`Nobody currently registered for ${message.channel.toString()}.`);
		return;
	}
	message.channel.send({embed});
}
