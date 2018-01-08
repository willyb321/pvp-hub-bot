/**
 * @module Commands
 */
/**
 * ignore
 */
import {config} from '../utils';
import * as Discord from 'discord.js';
import {client} from '../index';
import * as Raven from 'raven';


Raven.config(config.ravenDSN, {
	autoBreadcrumbs: true
}).install();

export function restart(message: Discord.Message) {
	if (!message.member.roles.map(elem => config.allowedRoles.includes(elem))) {
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
