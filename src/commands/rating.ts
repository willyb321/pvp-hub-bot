/**
 * @module Commands
 */
/**
 * ignore
 */
import {config} from '../utils';
import * as Discord from 'discord.js';
import * as Raven from 'raven';

import * as mongoose from 'mongoose';

mongoose.connect(config.mongoURL);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
	console.log('Mongo connected!');
});

Raven.config(config.ravenDSN, {
	autoBreadcrumbs: true
}).install();

export function rating(message: Discord.Message) {
	const pilotRating = (message.author);
	console.log(pilotRating.username);
}
