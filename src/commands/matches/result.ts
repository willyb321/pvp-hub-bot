/**
 * @module Commands
 */
/**
 * ignore
 */
import {config, figureOutTeams, genEmbed} from '../../utils';
import * as Raven from 'raven';
import {Match} from '../../db';
import * as Commando from 'discord.js-commando';
import {basename} from 'path';
import {client} from '../../index';

const PastebinAPI = require('pastebin-js');
const pastebin = new PastebinAPI(config.pastebinKey);

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
		if (!message.member.roles.find(elem => config.allowedRoles.includes(elem.id))) {
			return false;
		}
		if (!isNaN(figureOutTeams(message.channel))) {
			return true;
		}
		if (!config.allowedChannels.includes(message.channel.id)) {
			return false;
		}
		return !!message.member.roles.find(elem => config.allowedRoles.includes(elem.id));

	}

	async run(message, args) {
		const matchNum = args.matchNum;
		const winningTeam = args.winning;
		console.time(`Query match #${matchNum}`);
		return Match.findOneAndUpdate({matchNum}, {result: winningTeam})
			.then(res => {
				if (res && winningTeam !== 12) {
					console.timeEnd(`Query match #${matchNum}`);
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
				} else if (res && winningTeam === 12) {
					console.timeEnd('Start query');
					console.log(res);
					const embed = genEmbed('Match Result', `Game #${matchNum}`);
					embed.addField('Winning Team', 'Invalidated');
					return message.channel.send({embed});
				}
			})
			.catch(err => {
				console.error(err);
				Raven.captureException(err);
			});
	}

}
//
// export class RemoveMatchCommand extends Commando.Command {
// 	constructor(client) {
// 		super(client, {
// 			name: 'delgame',
// 			group: 'matches',
// 			memberName: 'delgame',
// 			description: '[Mod] Delete match from DB. Doesn\'t affect matchmaking.',
// 			details: '[Mod] Delete match from DB. Doesn\'t affect matchmaking.',
// 			examples: ['delgame 81 82'],
// 			args: [
// 				{
// 					key: 'matchNum',
// 					prompt: 'What game #',
// 					type: 'integer',
// 					validate: val => parseInt(val) >= 0,
// 					infinite: true
// 				}
// 			]
// 		});
// 	}
//
// 	hasPermission(message) {
// 		return client.isOwner(message.author);
// 	}
//
// 	async run(message, args) {
// 		const matchNum = args.matchNum;
// 		const winningTeam = args.winning;
// 		console.time('Start query');
// 		let response = `Deleted:\n`;
// 		let promises = [];
// 		matchNum.forEach(match => {
// 			console.log(match);
// 			promises.push(Match.findOneAndRemove({matchNum: match}))
// 		});
// 		return Promise.all(promises)
// 			.then(reses => {
// 				reses.forEach((elem, ind) => {
// 					if (elem) {
// 						response += `#${elem.matchNum}\n`;
// 					} else {
// 						response += `Not found\n`
// 					}
// 				});
// 				return pastebin
// 					.createPaste({
// 						text: response,
// 						title: `Matches deleted by ${message.author.tag} for ${new Date().toISOString()}`,
// 						expiration: '10M'
// 					})
// 					.then(data => {
// 						const embed = genEmbed(`Matches deleted by ${message.author.tag}`, `On ${new Date().toISOString()}`);
// 						console.log(data);
// 						embed.addField('Full list', data);
// 						return message.channel.send({embed});
// 					})
// 					.fail(err => {
// 						// Something went wrong
// 						console.log(err);
// 						Raven.captureException(err);
// 					});
// 			}).catch(err => {
// 				console.error(err);
// 				Raven.captureException(err);
// 			})
//
// 	}
//
// }
