/**
 * @module Commands
 */
/**
 * ignore
 */
import {config, genEmbed} from '../../utils';
import * as Discord from 'discord.js';
import * as Raven from 'raven';
import {IMatchDoc, Match} from '../../db';
import * as Commando from 'discord.js-commando';
import {basename} from "path";

Raven.config(config.ravenDSN, {
	autoBreadcrumbs: true,
	dataCallback: function (data) { // source maps
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

	async run(message, args) {
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
					embed.addField('Results:', matches.join('\n'));
					message.channel.send({embed});
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
