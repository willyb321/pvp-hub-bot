/**
 * @module Commands
 */
/**
 * ignore
 */
import {currentStatus, config} from '../utils';
import * as _ from 'lodash';
import * as Discord from 'discord.js';
import * as Raven from "raven";
import {start} from './start';
import { teams } from './teams';

Raven.config(config.ravenDSN, {
	autoBreadcrumbs: true
}).install();

export function register(message: Discord.Message) {
	if (!currentStatus.currentUsers[message.channel.id]) {
		currentStatus.currentUsers[message.channel.id] = [];
	}
	if (!currentStatus.teams[message.channel.id]) {
		currentStatus.teams[message.channel.id] = [];
	}
	let teamsNumber: number;
	try {
		if (message.channel.type !== 'text') {
			return;
		}
		const channel: any = message.channel;
		teamsNumber = parseInt(channel.name.split('v')[0]);
	} catch (err) {
		Raven.captureException(err);
	}
	if (currentStatus.currentUsers[message.channel.id].length >= teamsNumber * 2) {
		return message.reply('Full!');
	} else if (!currentStatus.currentUsers[message.channel.id].find(elem => elem === message.author)) {
		currentStatus.currentUsers[message.channel.id].push(message.author);
		message.reply('Added to the session');
		if (currentStatus.currentUsers[message.channel.id].length === teamsNumber * 2) {
			teams(message);
		}
		return;
	} else if (currentStatus.currentUsers[message.channel.id].find(elem => elem === message.author)) {
		message.reply('Already in the session.');
		return;
	}
	// currentStatus.currentUsers[message.channel.id] = _.uniq(currentStatus.currentUsers[message.channel.id]);
	// console.log(currentStatus.currentUsers);
}
