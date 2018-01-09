/**
 * @module Commands
 */
/**
 * ignore
 */
import {config, genEmbed} from '../utils';
import * as Discord from 'discord.js';
import {client} from '../index';
import * as Raven from 'raven';
import { Match } from '../db';


Raven.config(config.ravenDSN, {
	autoBreadcrumbs: true
}).install();

export function showgame(message: Discord.Message) {
	const matchNum = message.content.split(' ').length === 2 ? message.content.split(' ')[1] : null;
	if (!matchNum) {
		return message.reply(`Syntax: ?showgame [matchnum]. eg: ?showgame 1`)
	}
	console.time('Start query');
	Match.findOne({matchNum})
	.then(res => {
		if (res) {
			console.timeEnd('Start query');
			console.log(res);
			const embed = genEmbed(`Match Info`, `Game #${matchNum}`);
			embed.addField('Lobby', res.lobby);
			embed.addField('Time when first ?reg', res.startQueue);
			embed.addField('Filled Time', res.filledTime);
			embed.addField('Winning Team:', res.result);
			embed.addField('Time to select teams (seconds)', res.teamSelectionSec);
			let t1 = [];
			let t2 = [];
			for (const i of res.participants) {
				if (i.team === 1) {
					t1.push(`<@${i.id}>`)
				} else {
					t2.push(`<@${i.id}>`)
				}
			}
			embed.addField('Team 1', `${t1.join('\n')}`);
			embed.addField('Team 2', `${t2.join('\n')}`);
			message.channel.send({embed});
		}
	})
	.catch(err => {
		console.error(err);
		Raven.captureException(err);
	});
}
