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

Raven.config(config.ravenDSN, {
	autoBreadcrumbs: true
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
