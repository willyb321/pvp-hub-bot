/**
 * @module Commands
 */
/**
 * ignore
 */
import {currentStatus, config} from '../utils';
import * as Discord from 'discord.js';
import * as Raven from 'raven';
import {teams} from './teams';

Raven.config(config.ravenDSN, {
	autoBreadcrumbs: true
}).install();

export function register(message: Discord.Message) {
	if (!currentStatus.currentUsers[message.channel.id]) {
		currentStatus.currentUsers.set(message.channel.id, []);
	}
	if (!currentStatus.queueStartTimes[message.channel.id]) {
		currentStatus.queueStartTimes.set(message.channel.id, new Date());
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
	if (!currentStatus.teams[message.channel.id]) {
		currentStatus.teams.set(message.channel.id, []);
	}

	try {
		if (message.channel.type !== 'text') {
			return;
		}
		const channel: any = message.channel;
		teamsNumber = parseInt(channel.name.split('v')[0]);
	} catch (err) {
		Raven.captureException(err);
	}

	if (!teamsNumber) { teamsNumber = 2; }

	currentStatus.teamsNumber[message.channel.id] = teamsNumber;

	if (currentStatus.currentUsers[message.channel.id].length >= teamsNumber * 2) {
		return message.reply('Full!');
	} else if (!currentStatus.currentUsers.get(message.channel.id).find(elem => elem === message.author)) {
		currentStatus.currentUsers.get(message.channel.id).push(message.author);
		message.reply(`Added to the session\nCurrently registered: ${currentStatus.currentUsers[message.channel.id].length} / ${currentStatus.teamsNumber[message.channel.id] * 2}`);
		if (currentStatus.currentUsers.get(message.channel.id).length === teamsNumber * 2) {
			message.channel.send(`Initial Teams Ready. Pinging.\n${currentStatus.currentUsers[message.channel.id].join(' ')}`);
			teams(message);
		}
		return;
	} else if (currentStatus.currentUsers.get(message.channel.id).find(elem => elem === message.author)) {
		return message.reply('Already in the session.');
	}
	// currentStatus.currentUsers[message.channel.id] = _.uniq(currentStatus.currentUsers[message.channel.id]);
	// console.log(currentStatus.currentUsers);
}
