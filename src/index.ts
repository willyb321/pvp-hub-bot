/**
 * @module Index
 */
/**
 * ignore
 */
// Import modules
import 'source-map-support/register';
import * as Commando from 'discord.js-commando';
import * as _ from 'lodash';
import * as Raven from 'raven';
import {config} from './utils';
import {join} from "path";

Raven.config(config.ravenDSN, {
	autoBreadcrumbs: true
}).install();

// Create an instance of a Discord client
export const client = new Commando.Client({
	owner: config.ownerID,
	commandPrefix: '?'
});
const {allowedServers, token} = config;

client
	.on('error', console.error)
	.on('warn', console.warn);

process.on('uncaughtException', (err) => {
	console.error(err);
	Raven.captureException(err);
});

process.on('unhandledRejection', (err: Error) => {
	console.error(err);
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

client.registry
	.registerGroup('matches', 'Matches')
	.registerGroup('misc', 'Misc')
	.registerDefaults()
	.registerCommandsIn(join(__dirname, 'commands', 'matches'))
	.registerCommandsIn(join(__dirname, 'commands', 'misc'));

// Log our bot in
client.login(token)
	.then(() => {
		console.log('PvP Hub bot logged in.');
	})
	.catch((err: Error) => {
		Raven.captureException(err);
		process.exit(1);
	});
