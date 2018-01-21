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
			memberName: 'promote',
			description: 'Promote a match.',
			details: 'Promote a matchcoin.',
			examples: ['promote', 'p']
		});
	}

	async run(msg, args) {
		if (!currentStatus.teamsNumber.has(msg.channel.id)) {
			let teamsNumber: number;
			try {
				if (msg.channel.type !== 'text') {
					return;
				}
				const channel: any = msg.channel;
				teamsNumber = parseInt(channel.name.split('v')[0]);
			} catch (err) {
				console.log(err);
				Raven.captureException(err);
			}
			if (!teamsNumber) {
				teamsNumber = 2;
			}
			currentStatus.teamsNumber.set(msg.channel.id, teamsNumber);
		}
		const max = currentStatus.teamsNumber.get(msg.channel.id) * 2;
		const current = currentStatus.currentUsers.get(msg.channel.id).length;

		const mesg = `@ahere only ${max - current} needed for ${msg.channel.toString()}`
		return msg.channel.send(mesg);
	}

}
