/**
 * @module Index
 */
/**
 * ignore
 */
// Import modules
import 'source-map-support/register';
import * as Discord from 'discord.js';
import * as Commands from './commands';
import * as _ from 'lodash';
import * as Raven from 'raven';
import {config, currentStatus} from './utils';

Raven.config(config.ravenDSN, {
	autoBreadcrumbs: true
}).install();

// Create an instance of a Discord client
export const client = new Discord.Client();
const {allowedServers, token} = config;

process.on('uncaughtException', (err: Error) => {
	Raven.captureException(err);
});

process.on('unhandledRejection', (err: Error) => {
	Raven.captureException(err);
});


// The ready event is vital, it means that your bot will only start reacting to information
// from Discord _after_ ready is emitted
client.on('ready', () => {
	console.log('I am ready!');
	client.user.setGame('the pew pews')
		.then(() => {
			// no-op
		})
		.catch(err => {
			Raven.captureException(err);
		});
});

// Create an event listener for messages
client.on('message', (message: Discord.Message) => {
	if (message.author.id === client.user.id) {
		return;
	}
	if (_.indexOf(allowedServers, message.guild.id) === -1) {
		return;
	}
	if (_.indexOf(config.allowedChannels, message.channel.id) === -1) {
		return;
	}
	message.content = message.content.toLowerCase();
	// If the message is "!start"

	if (message.content === '?start') {
		// Send "pong" to the same channel
		return Commands.start(message);
	}
	if (message.content === '?register' || message.content === '?reg') {
		// Send "pong" to the same channel
		return Commands.register(message);
	}
	if (message.content.startsWith('?unregister') || message.content.startsWith('?unreg')) {
		// Send "pong" to the same channel
		return Commands.unregister(message);
	}
	if (message.content === '?who') {
		// Send "pong" to the same channel
		return Commands.who(message);
	}
	if (message.content.startsWith('?teams')) {
		// Send "pong" to the same channel
		return Commands.teams(message);
	}
	if (message.content.startsWith('?rating')) {
		// Send "pong" to the same channel
		return Commands.rating(message);
	}
	if (message.content.startsWith('?remove')) {
		// Send "pong" to the same channel
		return Commands.remove(message);
	}
	if (message.content === '?new') {
		// Send "pong" to the same channel
		return Commands.reset(message);
	}
	if (message.content === '?help') {
		// Send "pong" to the same channel
		return Commands.help(message);
	}
	if (message.content === '?restart') {
		// Send "pong" to the same channel
		return Commands.restart(message);
	}
	if (message.content === '?status') {
		// Send "pong" to the same channel
		return Commands.status(message);
	}
	// if (message.content.startsWith('?')) {
	// 	return message.reply('whadiyatalkinabeet');
	// }
});
// Log our bot in
client.login(token)
	.then(() => {
		console.log(`PvP Hub bot logged in.`)
	})
	.catch((err: Error) => {
		Raven.captureException(err);
		process.exit(1);
	});
