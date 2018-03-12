/**
 * @module Commands
 */
/**
 * ignore
 */
import {config, genEmbed} from '../../utils';
import * as Raven from 'raven';
import * as Commando from 'discord.js-commando';
import {Match} from '../../db';
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

export class WinCountCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'wincount',
			group: 'misc',
			memberName: 'wincount',
			description: 'Shows how many matches you have win.',
			details: 'Shows how many matches you have win.',
			examples: ['wincount']
		});
	}

	hasPermission(msg) {
		return !!msg.member;
	}

	async run(message) {
		Match.count({'participants.id': message.author.id, $where: `this.participants.find(elem => elem.id === ${message.author.id}) !== undefined && this.participants.find(elem => elem.id === ${message.author.id}).team === this.result`})
			.then(elem => {
					console.log(`User: ${message.author.tag} - ${elem} Wins`);
					const member = message.member;
					if (member) {
						const embed = genEmbed(`${member.displayName} # of matches`, `${elem} matches`);
						message.channel.send({embed});
					}
				});
	}

}
