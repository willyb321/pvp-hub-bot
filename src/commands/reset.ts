/**
 * @module Commands
 */
/**
 * ignore
 */
import {currentStatus, config} from '../utils';
import * as Discord from 'discord.js';
import {collectors} from './index';

export function reset(message: Discord.Message, timeout?: boolean) {
	if (timeout) {
		return resetCounters(message);
	}
	if (message.member.roles.find(elem => config.allowedRoles.includes(elem.id))) {
		return resetCounters(message);
	}
	if (!currentStatus.currentUsers.has(message.channel.id) || !currentStatus.currentUsers.get(message.channel.id).find(elem => elem.id === message.author.id)) {
		return message.reply('You aren\'t in the session');
	}
	return resetCounters(message);
}

function resetCounters(message: Discord.Message) {
	currentStatus.currentUsers.set(message.channel.id, []);
	currentStatus.teams.set(message.channel.id, []);
	if (currentStatus.timeouts.has(message.channel.id)) {
		clearTimeout(currentStatus.timeouts[message.channel.id]);
	}
	currentStatus.timeouts.delete(message.channel.id);
	currentStatus.locked.delete(message.channel.id);
	currentStatus.teamMessage.delete(message.channel.id);
	currentStatus.teamsNumber.delete(message.channel.id);
	currentStatus.queueStartTimes.delete(message.channel.id);
	currentStatus.queueEndTimes.delete(message.channel.id);
	currentStatus.queueTeamTimes.delete(message.channel.id);
	collectors.forEach(elem => elem.cleanup());
	collectors.slice(0, collectors.length);
	return message.channel.send('New session created.');
}
