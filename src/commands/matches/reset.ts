/**
 * @module Commands
 */
/**
 * ignore
 */
import {currentStatus, config} from '../../utils';
import {collectors} from './teams';
import * as Commando from 'discord.js-commando';
import {basename} from 'path';
import * as Raven from 'raven';

Raven.config(config.ravenDSN, {
	autoBreadcrumbs: true,
	dataCallback (data) { // source maps
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

export class NewCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'new',
			group: 'matches',
			memberName: 'new',
			description: 'Resets current channel queue.',
			details: 'Resets current channel queue.',
			examples: ['new']
		});
	}
	hasPermission(message) {
		if (!message.channel) {
			return false;
		}
		if (message.member.roles.find(elem => config.allowedRoles.includes(elem.id))) {
			return true
		}
		if (!currentStatus.currentUsers.has(message.channel.id) || !currentStatus.currentUsers.get(message.channel.id).find(elem => elem.id === message.author.id)) {
			return false
		}

		return true
	}
	async run(message) {
		reset(message);
	}

}

export function reset(message: Commando.CommandoMessage, timeout?: boolean) {
	if (timeout) {
		return resetCounters(message);
	}
	if (!message.channel) {
		return
	}
	if (message.member && message.member.roles.find(elem => config.allowedRoles.includes(elem.id))) {
		return resetCounters(message);
	}
	if (!currentStatus.currentUsers.has(message.channel.id) || !currentStatus.currentUsers.get(message.channel.id).find(elem => elem.id === message.author.id)) {
		return message.reply('You aren\'t in the session');
	}
	return resetCounters(message);
}

export function resetCounters(message: Commando.CommandoMessage) {
	if (!message.channel) {
		return;
	}
	if (!config.allowedChannels.includes(message.channel.id)) {
		return;
	}
	currentStatus.currentUsers.set(message.channel.id, []);
	currentStatus.teams.set(message.channel.id, []);
	if (currentStatus.timeouts.has(message.channel.id)) {
		clearTimeout(currentStatus.timeouts.get(message.channel.id));
	}
	currentStatus.timeouts.delete(message.channel.id);
	currentStatus.locked.delete(message.channel.id);
	currentStatus.teamMessage.delete(message.channel.id);
	currentStatus.teams.delete(message.channel.id);
	currentStatus.teamsNumber.delete(message.channel.id);
	currentStatus.queueStartTimes.delete(message.channel.id);
	currentStatus.queueEndTimes.delete(message.channel.id);
	currentStatus.queueTeamTimes.delete(message.channel.id);
	collectors.forEach(elem => elem.cleanup());
	collectors.slice(0, collectors.length);
	return message.channel.send('New session created.');
}
