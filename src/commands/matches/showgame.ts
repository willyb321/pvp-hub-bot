/**
 * @module Commands
 */
/**
 * ignore
 */
import {config, figureOutTeams, genEmbed} from '../../utils';
import * as Raven from 'raven';
import {IMatchDoc, Match} from '../../db';
import * as Commando from 'discord.js-commando';
import {basename} from 'path';

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

export class ShowGameCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'showgame',
			group: 'matches',
			memberName: 'showgame',
			description: 'Show info about a game.',
			details: 'Show info about a game.',
			examples: ['showgame 1'],

			args: [
				{
					key: 'match',
					prompt: 'What game #',
					type: 'integer',
					validate: val => parseInt(val) >= 0
				}
			]
		});
	}

	hasPermission(message) {
		if (!isNaN(figureOutTeams(message.channel))) {
			return true;
		}
		return config.allowedChannels.includes(message.channel.id);
	}

	async run(message, args) {
		const matchNum = args.match;
		console.time(`Query match #${matchNum}`);
		return Match.findOne({matchNum})
			.then((res: IMatchDoc) => {
				if (res) {
					console.timeEnd(`Query match #${matchNum}`);
					console.log(res);
					const embed = genEmbed('Match Info', `Game #${matchNum}`);
					embed.addField('Lobby', res.lobby);
					embed.addField('Time when first ?reg', res.startQueue);
					embed.addField('Filled Time', res.filledTime);
					embed.addField('Winning Team:', res.result);
					embed.addField('Time to select teams (secs)', Math.round(res.teamSelectionSec));
					embed.addField('Amount of rerolls', res.rerollCount);
					const t1 = [];
					const t2 = [];
					for (const i of res.participants) {
						if (i.team === 1) {
							t1.push(`<@${i.id}>`);
						} else {
							t2.push(`<@${i.id}>`);
						}
					}
					embed.addField('Team 1', `${t1.join('\n')}`);
					embed.addField('Team 2', `${t2.join('\n')}`);
					return message.channel.send({embed});
				} else {
					return message.channel.send('Game not found.');
				}
			})
			.catch(err => {
				console.error(err);
				Raven.captureException(err);
			});
	}
}
