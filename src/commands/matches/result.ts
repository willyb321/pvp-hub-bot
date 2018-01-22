/**
 * @module Commands
 */
/**
 * ignore
 */
import {config, genEmbed} from '../../utils';
import * as Raven from 'raven';
import {Match} from '../../db';
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

export class ResultCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'result',
			group: 'matches',
			memberName: 'result',
			description: '[Mod] Set result for match. Doesn\'t affect matchmaking.',
			details: '[Mod] Set result for match. Doesn\'t affect matchmaking.',
			examples: ['result 13 1'],
			args: [
				{
					key: 'matchNum',
					prompt: 'What game #',
					type: 'integer',
					validate: val => parseInt(val) >= 0
				},
				{
					key: 'winning',
					prompt: 'What team won? (1/2) (12 if invalid)',
					type: 'integer',
					validate: val => parseInt(val) === 1 || parseInt(val) === 12 || parseInt(val) === 2
				}
			]
		});
	}

	hasPermission(message) {
		if (!config.allowedChannels.includes(message.channel.id)) {
			return false;
		}

		if (!message.member.roles.find(elem => config.allowedRoles.includes(elem.id))) {
			return false;
		}
		return true;
	}

	async run(message, args) {
		const matchNum = args.matchNum;
		const winningTeam = args.winning;
		console.time('Start query');
		Match.findOneAndUpdate({matchNum}, {result: winningTeam})
			.then(res => {
				if (res) {
					console.timeEnd('Start query');
					console.log(res);
					const embed = genEmbed('Match Result', `Game #${matchNum}`);
					embed.addField('Winning Team #', winningTeam);
					const t = [];
					for (const i of res.participants) {
						if (i.team === parseInt(winningTeam)) {
							t.push(`<@${i.id}>`);
						}
					}
					embed.addField('Team Members', `${t.join('\n')}`);
					message.channel.send({embed});
				}
			})
			.catch(err => {
				console.error(err);
				Raven.captureException(err);
			});
	}

}
