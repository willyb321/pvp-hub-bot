/**
 * @module Commands
 */
/**
 * ignore
 */
import {config, currentStatus, figureOutTeams, teams} from '../../utils';
import * as Raven from 'raven';
import * as Commando from 'discord.js-commando';
import {basename} from 'path';

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

export class TeamsCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'teams',
			group: 'matches',
			memberName: 'teams',
			description: 'Get teams.',
			details: 'Get teams.',
			examples: ['teams']
		});
	}

	hasPermission(message) {
		if (!message.channel || !message.channel.id) {
			return false;
		}
		if (!isNaN(figureOutTeams(message.channel))) {
			return true;
		}
		if (!config.allowedChannels.includes(message.channel.id)) {
			return false;
		}
		return !!currentStatus.currentUsers.get(message.channel.id).find(elem => elem.id === message.author.id);

	}

	async run(message) {
		teams(message);
		return [];
	}
}

