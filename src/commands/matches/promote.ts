/**
 * @module Commands
 */
/**
 * ignore
 */
import {config, currentStatus, figureOutTeams} from '../../utils';
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

export class PromoteCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'promote',
			aliases: ['p'],
			throttling: {usages: 1, duration: 60},
			group: 'misc',
			memberName: 'promote',
			description: 'Promote a match.',
			details: 'Promote a match.',
			examples: ['promote', 'p']
		});
	}
	hasPermission(msg) {
		if (!isNaN(figureOutTeams(msg)) && figureOutTeams(msg) > 1) {
			return true;
		}
		if (!currentStatus.currentUsers.has(msg.channel.id)) {
			return false
		}
		return !!currentStatus.currentUsers.get(msg.channel.id).find(elem => elem.id === msg.author.id)
	}
	async run(msg, args) {
		if (!currentStatus.teamsNumber.has(msg.channel.id)) {
			let teamsNumber: number;
			try {
				if (msg.channel.type !== 'text') {
					return;
				}
				const channel = msg.channel;
				teamsNumber = parseInt(channel.name.split('v')[0]);
			} catch (err) {
				console.log(err);
				Raven.captureException(err);
			}
			if (!teamsNumber) {
				teamsNumber = 2;
			}
			currentStatus.teamsNumber.set(msg.channel.id, teamsNumber);
		}
		const max = currentStatus.teamsNumber.get(msg.channel.id) * 2;
		const current = currentStatus.currentUsers.get(msg.channel.id).length;

		const mesg = `@here only ${max - current} needed for ${msg.channel.toString()}`;
		return msg.channel.send(mesg);
	}

}
