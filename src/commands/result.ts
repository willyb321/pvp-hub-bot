/**
 * @module Commands
 */
/**
 * ignore
 */
import {config, genEmbed} from '../utils';
import * as Discord from 'discord.js';
import * as Raven from 'raven';
import {Match} from '../db';

Raven.config(config.ravenDSN, {
	autoBreadcrumbs: true
}).install();

export function result(message: Discord.Message) {
	const matchNum = message.content.split(' ').length === 3 ? message.content.split(' ')[1] : null;
	const winningTeam = message.content.split(' ').length === 3 ? message.content.split(' ')[2] : null;
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
				if (i.team === winningTeam) {
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
