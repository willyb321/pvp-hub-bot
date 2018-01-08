/**
 * @module Commands
 */
/**
 * ignore
 */
import {currentStatus} from '../utils';
import * as Discord from 'discord.js';
import * as _ from 'lodash';

export function start(message: Discord.Message) {
	if (!currentStatus.currentUsers[message.channel.id]) {
		currentStatus.currentUsers[message.channel.id] = [];
	}
	currentStatus.currentUsers[message.channel.id].push(message.author);
	currentStatus.currentUsers[message.channel.id] = _.uniq(currentStatus.currentUsers[message.channel.id]);
	message.channel.send(`${message.channel.toString()} session started. Registered ${message.author.toString()}. Use !reg[ister] to join.`);
}
