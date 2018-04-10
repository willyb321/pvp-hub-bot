/**
 * @module Commands
 */
/**
 * ignore
 */
import {config} from '../../utils';
import {client} from '../../index';
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

export class RestartCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'restart',
			group: 'misc',
			memberName: 'restart',
			description: 'Restarts bot.',
			details: 'This command restarts the bot.',
			examples: ['restart']
		});
	}

	hasPermission(msg) {
		if (client.isOwner(msg.author)) {
			return true
		}
		if (!msg.member) {
			return false;
		}
		return !!msg.member.roles.find(elem => config.allowedRoles.includes(elem.id));

	}

	async run(message) {
		console.log('Restarting');
		return message.channel.send(':wave:')
			.then(() => {
				client.destroy()
					.then(() => {
						process.exit(0);
					})
					.catch(err => {
						Raven.captureException(err);
						process.exit(1);
					});
			}).catch(err => {
			Raven.captureException(err);
			process.exit(1);
		});
	}

}
