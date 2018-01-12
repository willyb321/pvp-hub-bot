/**
 * @module Commands
 */
/**
 * ignore
 */
import {config, genEmbed} from '../../utils';
import * as Discord from 'discord.js';
import * as Raven from 'raven';
import {Match} from '../../db';
import * as Commando from 'discord.js-commando';

Raven.config(config.ravenDSN, {
	autoBreadcrumbs: true
}).install();



export class ResultCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'result',
			group: 'matches',
			memberName: 'result',
			description: 'Gets queue for current channel.',
			details: 'Gets queue for current channel.',
			examples: ['who'],

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

	async run(message, args) {
		const matchNum = args.matchNum;
		const winningTeam = args.winning;
		console.log(message.content.split(' '));
		if (!message.member.roles.find(elem => config.allowedRoles.includes(elem.id))) {
			console.log('Not modifying game.');
			return;
		}
		if (!matchNum || !winningTeam) {
			return message.reply('Syntax: ?result [matchnum] [winning team]. eg: ?result 0 1');
		}
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
