/**
 * @module Commands
 */
/**
 * ignore
 */
import * as Discord from 'discord.js';
import {config, genEmbed, currentStatus} from "../../utils";
import * as Commando from 'discord.js-commando';
import {basename} from "path";
import * as Raven from "raven";

Raven.config(config.ravenDSN, {
	autoBreadcrumbs: true,
	dataCallback: function (data) { // source maps
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

/**
 * Coin flip
 */
const flip = () => (Math.floor(Math.random() * 2) == 0) ? 'heads' : 'tails';


export class PromoteCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'promote',
			aliases: ['p'],
			throttling: {usages: 1, duration: 60},
			group: 'misc',
			memberName: 'flip',
			description: 'Flip a theoretical coin.',
			details: 'Flip a theoretical coin.',
			examples: ['flip']
		});
	}

	async run(msg, args) {
		const max = currentStatus.teamsNumber.get(msg.channel.id) * 2;
		const current = currentStatus.currentUsers.get(msg.channel.id).length;

		const mesg = `@here only ${max - current} needed for ${msg.channel.toString()}`
		return msg.channel.send(mesg);
	}

}
