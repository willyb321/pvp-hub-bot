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
    if (!message.mentions.users.array()[0]) {
    	message.channel.send('Nobody specified to remove! Use !reset to reset the session.');
    	return;
	}
	const currentUsers = currentStatus.currentUsers[message.channel.id];
	currentStatus.currentUsers[message.channel.id] = currentStatus.currentUsers[message.channel.id].splice(currentUsers.findIndex(elem => elem.id !== message.mentions.users.first().id))
}
