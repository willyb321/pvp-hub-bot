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

	async run(message) {
		if (!message.member.roles.find(elem => config.allowedRoles.includes(elem.id))) {
			console.log('Not restarting');
			return;
		}
		console.log('Restarting');
		message.channel.send(':wave:')
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
