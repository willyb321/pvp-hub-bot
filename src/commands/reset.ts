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

export function reset(message: Discord.Message) {
	if (!currentStatus.currentUsers[message.channel.id] || !currentStatus.currentUsers[message.channel.id].find(elem => elem === message.author)) {
		return message.reply('You aren\'t in the session');
	}
	currentStatus.currentUsers[message.channel.id] = [];
	currentStatus.teams[message.channel.id] = [];
	currentStatus.locked[message.channel.id] = false;
	currentStatus.teamMessage[message.channel.id] = [];
	currentStatus.teamsNumber[message.channel.id] = [];
	collectors.forEach(elem => elem.cleanup());
	collectors.slice(0, collectors.length);
	message.reply('New session created.');
}
