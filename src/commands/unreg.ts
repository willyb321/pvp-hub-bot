/**
 * @module Commands
 */

/** ignore */
import {currentStatus} from '../utils';
import * as _ from 'lodash';
import * as Discord from 'discord.js';
import {teams} from './index';

export function unregister(message: Discord.Message) {
	currentStatus.currentUsers.set(message.channel.id, _.uniq(currentStatus.currentUsers.get(message.channel.id)));
	if (currentStatus.currentUsers.get(message.channel.id).find(elem => elem.id === message.author.id)) {
		_.remove(currentStatus.currentUsers.get(message.channel.id), elem => elem.id === message.author.id);
		message.channel.send(`Unregistered ${message.member.displayName}.`);
		if (currentStatus.currentUsers.get(message.channel.id).length === 0) {
			currentStatus.queueStartTimes.set(message.channel.id, null);
		}
		if (currentStatus.teams.has(message.channel.id) && currentStatus.teams.get(message.channel.id).length === 2) {
			if (currentStatus.currentUsers.get(message.channel.id).length !== currentStatus.teams.get(message.channel.id)[0].length + currentStatus.teams.get(message.channel.id)[1].length)
			teams(message);
		}
		return;
	}
}
