/**
 * @module Commands
 */
/**
 * ignore
 */
import {config, genEmbed} from '../../utils';
import * as Raven from 'raven';
import {IMatchDoc, Match} from '../../db';
import * as Commando from 'discord.js-commando';
import {basename} from 'path';
import {client} from "../../index";

const PastebinAPI = require('pastebin-js')
const pastebin = new PastebinAPI(config.pastebinKey);

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

export class NoResultsCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'shownores',
			group: 'matches',
			memberName: 'shownores',
			description: 'Shows games with no results.',
			details: 'Shows games with no results.',
			examples: ['shownores']
		});
	}

	hasPermission(msg) {
		return client.isOwner(msg.author);
	}

	async run(message) {
		if (!config.allowedChannels.includes(message.channel.id)) {
			return;
		}
		console.time('Start query');
		Match.find({result: 12})
			.then((res: IMatchDoc[]) => {
				if (res) {
					console.timeEnd('Start query');
					const embed = genEmbed('Matches With no result', `${res.length} matches`);
					const matches = [];
					for (const i of res) {
						matches.push(i.matchNum);
					}
					pastebin
						.createPaste({
							text: matches.join('\n'),
							title: `Matches with no result for ${new Date().toISOString()}`,
							expiration: '10M'
						})
						.then(data => {
							console.log(data);
							embed.addField('Full list', data);
							embed.addField('Results:', matches.slice(-10).join('\n'));
							message.channel.send({embed});
						})
						.fail(err => {
							// Something went wrong
							console.log(err);
							Raven.captureException(err);
						});
				} else {
					message.channel.send('No games found.');
				}
			})
			.catch(err => {
				console.error(err);
				Raven.captureException(err);
			});
	}
}
