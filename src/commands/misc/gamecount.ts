/**
 * @module Commands
 */
/**
 * ignore
 */
import {config, genEmbed} from '../../utils';
import {client} from '../../index';
import * as Raven from 'raven';
import * as Commando from 'discord.js-commando';
import {IMatch, IMatchDoc, IParticipants, Match} from '../../db';
import {basename} from 'path';
import {Role} from "discord.js";
import * as _ from "lodash";

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

export class GameCountCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'gamecount',
			group: 'misc',
			memberName: 'gamecount',
			description: 'Shows how many matches you have done.',
			details: 'Shows how many matches you have done.',
			examples: ['gamecount']
		});
	}

	hasPermission(msg) {
		return !!msg.member;
	}

	async run(message) {
		return Match.find({'participants.id': message.author.id})
			.then(elem => {
					if (elem && elem.length > 0) {
						console.log(`User: ${message.author.id} - ${elem.length} Matches`);
						const member = message.member;
						if (member) {
							const embed = genEmbed(`${member.displayName} # of matches`, `${elem.length} matches`);
							return message.channel.send({embed});
						}
					} else {
						console.log(`User: ${message.author.id} - 0 Matches`);
						const member = message.member;
						if (member) {
							const embed = genEmbed(`${member.displayName} # of matches`, `0 matches`);
							return message.channel.send({embed});
						}
					}
				});
	}

}
