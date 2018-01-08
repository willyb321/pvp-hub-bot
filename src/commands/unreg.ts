/**
 * @module Commands
 */

/** ignore */
import {currentStatus} from '../utils';
import * as _ from 'lodash';
import * as Discord from 'discord.js';
import { teams } from './index';

export function unregister(message: Discord.Message) {
	currentStatus.currentUsers[message.channel.id] = _.uniq(currentStatus.currentUsers[message.channel.id]);
	if (currentStatus.currentUsers[message.channel.id].find(elem => elem === message.author)) {
		_.remove(currentStatus.currentUsers[message.channel.id], elem => elem === message.author);
		message.channel.send(`Unregistered ${message.author.username}.`);
		if (currentStatus.teams[message.channel.id] && currentStatus.teams[message.channel.id].length === 2 && currentStatus.currentUsers[message.channel.id].length !== currentStatus.teams[message.channel.id][0].length + currentStatus.teams[message.channel.id][1].length) {
			teams(message);
		}
		return;
	}
}
