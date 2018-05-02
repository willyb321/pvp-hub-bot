/**
 * @module Commands
 */
/**
 * ignore
 */
import { config, genEmbed } from '../../utils';
import { client } from '../../index';
import * as Raven from 'raven';
import * as Commando from 'discord.js-commando';
import { IMatch, IMatchDoc, IParticipants, Match } from '../../db';
import { basename } from 'path';
import { Role } from "discord.js";
import * as _ from "lodash";

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

export class LeaderBoardCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'leaderboard',
			group: 'misc',
			memberName: 'leaderboard',
			description: 'Shows how many matches the server has done.',
			details: 'Shows how many matches the server has done.',
			examples: ['leaderboard']
		});
	}

	hasPermission(msg) {
		return client.isOwner(msg.author);
	}

	async run(message) {
		return Match.aggregate([{ $unwind: "$participants" }, { $sortByCount: "$participants.id" }])
			.limit(25)
			.sort({count: -1})
			.then(elems => {
				if (elems && elems.length > 0) {
					const embed = genEmbed(`${message.guild.name} # of matches`, `Sorted by match count.`);
					for (const i in elems) {
						console.log(elems[i])
						const member = message.guild.members.get(elems[i]._id);
						if (!member) {
							continue;
						}
						console.log(`User: ${member.displayName} - ${elems[i].count} Matches`);
						embed.addField(`#${parseInt(i) + 1}`, `${member.toString()} - ${elems[i].count} matches`);
					}
					return message.channel.send({embed});
				} else {
					return message.channel.send('¯\\_(ツ)_/¯')
				}
			});
	}

}
