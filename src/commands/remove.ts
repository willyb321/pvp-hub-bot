/**
 * @module Commands
 */
/**
 * ignore
 */
import {currentStatus, config} from '../utils';
import * as Discord from 'discord.js';
import * as _ from 'lodash';

export function remove(message: Discord.Message) {
	if (!message.member.roles.map(elem => config.allowedRoles.includes(elem))) {
		console.log('No perms');
		return;
	}
    if (!message.mentions.users.first()) {
    	message.channel.send('Nobody specified to remove! Use !new to make a new session.');
    	return;
	}
	if (!currentStatus.currentUsers[message.channel.id].find(elem => elem.id === message.mentions.users.first().id)) {
		return message.reply('User isn\'t registered.');
	}
	const currentUsers = currentStatus.currentUsers[message.channel.id];
	currentStatus.currentUsers[message.channel.id].splice(currentUsers.findIndex(elem => elem.id === message.mentions.users.first().id), 1);
	if (currentStatus.currentUsers[message.channel.id].length === 0) {
		currentStatus.queueStartTimes[message.channel.id] = null;
	}
	message.channel.send(`:ok_hand: ${message.mentions.members.first().displayName} removed.`);
}
