/**
 * @module Commands
 */
/**
 * ignore
 */
import {currentStatus, config, reset} from '../../utils';
import * as Commando from 'discord.js-commando';
import {basename} from 'path';
import * as Raven from 'raven';
import {updateQueues} from '../../queuesUpdate';
import {Message} from 'discord.js';

Raven.config(config.ravenDSN, {
	autoBreadcrumbs: true,
	dataCallback(data) { // source maps
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
		if (!message.member) {
			return false;
		}
		if (!currentStatus.guilds.get(message.guild.id).currentUsers.has(message.channel.id)) {
			return false;
		}
		return !!currentStatus.guilds.get(message.guild.id).currentUsers.get(message.channel.id).find(elem => elem.id === message.author.id);

	}
	async run(message) {
		return reset(message);
	}

}
