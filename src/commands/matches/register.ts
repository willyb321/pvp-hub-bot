/**
 * @module Commands
 */
/**
 * ignore
 */
import {currentStatus, config} from '../../utils';
import * as Discord from 'discord.js';
import * as Raven from 'raven';
import {teams} from './teams';
import * as Commando from 'discord.js-commando';
import {basename} from "path";

Raven.config(config.ravenDSN, {
	autoBreadcrumbs: true,
	dataCallback: function (data) { // source maps
		const stacktrace = data.exception && data.exception[0].stacktrace;

		if (stacktrace && stacktrace.frames) {
			stacktrace.frames.forEach(frame => {
				if (frame.filename.startsWith('/')) {
					frame.filename = 'app:///' + basename(frame.filename);
				}
			});
		}

		return data;
	}
}).install();

export class RegisterCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'reg',
			group: 'matches',
			memberName: 'reg',
			description: 'Register yourself for current channel queue.',
			details: 'Register yourself for current channel queue.',
			examples: ['reg']
		});
	}

	async run(message) {
		if (!config.allowedChannels.includes(message.channel.id)) {
			return;
		}
		if (message.channel.type !== 'text') {
			return;
		}
		if (!currentStatus.currentUsers.has(message.channel.id)) {
			currentStatus.currentUsers.set(message.channel.id, []);
		}
		if (!currentStatus.queueStartTimes.has(message.channel.id)) {
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
		if (!currentStatus.teams.has(message.channel.id)) {
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

		if (!teamsNumber) {
			teamsNumber = 2;
		}

		currentStatus.teamsNumber.set(message.channel.id, teamsNumber);

		if (currentStatus.currentUsers.get(message.channel.id).length >= teamsNumber * 2) {
			return message.reply('Full!');
		} else if (!currentStatus.currentUsers.get(message.channel.id).find(elem => elem === message.author)) {
			currentStatus.currentUsers.get(message.channel.id).push(message.author);
			message.reply(`Added to the session\nCurrently registered: ${currentStatus.currentUsers.get(message.channel.id).length} / ${currentStatus.teamsNumber.get(message.channel.id) * 2}`);
			if (currentStatus.currentUsers.get(message.channel.id).length === teamsNumber * 2) {
				message.channel.send(`Initial Teams Ready. Pinging.\n${currentStatus.currentUsers.get(message.channel.id).join(' ')}`);
				teams(message);
			}
			return;
		} else if (currentStatus.currentUsers.get(message.channel.id).find(elem => elem === message.author)) {
			return message.reply('Already in the session.');
		}
	}

}
