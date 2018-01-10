/**
 * @module Commands
 */
/**
 * ignore
 */
import {currentStatus, config} from '../utils';
import * as Discord from 'discord.js';
import * as _ from 'lodash';
import { collectors } from './index';

export function reset(message: Discord.Message, timeout?: boolean) {
	if (timeout) {
		return resetCounters(message);
	}
	if (message.member.roles.find(elem => config.allowedRoles.includes(elem.id))) {
		return resetCounters(message)
	}
	if (!currentStatus.currentUsers[message.channel.id] || !currentStatus.currentUsers[message.channel.id].find(elem => elem === message.author)) {
		return message.reply('You aren\'t in the session');
	}
	return resetCounters(message);
}

function resetCounters(message: Discord.Message) {
	currentStatus.currentUsers[message.channel.id] = [];
	currentStatus.teams[message.channel.id] = [];
	if (currentStatus.timeouts[message.channel.id]) {
		clearTimeout(currentStatus.timeouts[message.channel.id])
	}
	currentStatus.timeouts[message.channel.id] = null;
	currentStatus.locked[message.channel.id] = false;
	currentStatus.teamMessage[message.channel.id] = [];
	currentStatus.teamsNumber[message.channel.id] = [];
	currentStatus.queueStartTimes[message.channel.id] = undefined;
	currentStatus.queueEndTimes[message.channel.id] = undefined;
	currentStatus.queueTeamTimes[message.channel.id] = null;
	collectors.forEach(elem => elem.cleanup());
	collectors.slice(0, collectors.length);
	return message.channel.send('New session created.');
}
