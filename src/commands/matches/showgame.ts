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

Raven.config(config.ravenDSN, {
	autoBreadcrumbs: true
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

			args: [{
				key: 'match',
				prompt: 'What game #',
				type: 'integer',
				validate: val => parseInt(val) >= 0
			}]
		});
	}

	async run(message, args) {
		const matchNum = args.match;
		console.time('Start query');
		Match.findOne({matchNum})
			.then((res: IMatchDoc) => {
				if (res) {
					console.timeEnd('Start query');
					console.log(res);
					const embed = genEmbed('Match Info', `Game #${matchNum}`);
					embed.addField('Lobby', res.lobby);
					embed.addField('Time when first ?reg', res.startQueue);
					embed.addField('Filled Time', res.filledTime);
					embed.addField('Winning Team:', res.result);
					embed.addField('Time to select teams (minutes)', res.teamSelectionSec);
					embed.addField('Amount of rerolls', res.rerollCount || 'Unknown');
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
					message.channel.send({embed});
				} else {
					message.channel.send('Game not found.');
				}
			})
			.catch(err => {
				console.error(err);
				Raven.captureException(err);
			});
	}
}