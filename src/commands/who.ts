/**
 * @module Commands
 */
/**
 * ignore
 */
import {currentStatus} from '../utils';
import * as Discord from 'discord.js';

export function who(message: Discord.Message) {
	const usernames = [];
	if (!currentStatus.currentUsers[message.channel.id]) {
		currentStatus.currentUsers[message.channel.id] = [];
	}
	currentStatus.currentUsers[message.channel.id].forEach(elem => {
		usernames.push(elem.username);
	});
	if (currentStatus.currentUsers[message.channel.id].length === 0) {
		message.channel.send('Nobody training currently.');
		return;
	}
	message.channel.send('Current Queue:\n' + usernames.join('\n'));
}
