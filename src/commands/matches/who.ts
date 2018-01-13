/**
 * @module Commands
 */
/**
 * ignore
 */
import {config, currentStatus, genEmbed} from '../../utils';
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


export class WhoCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'who',
			group: 'matches',
			memberName: 'who',
			description: 'Gets queue for current channel.',
			details: 'Gets queue for current channel.',
			examples: ['who']
		});
	}

	async run(message) {
		if (!config.allowedChannels.includes(message.channel.id)) {
			return;
		}
		if (!currentStatus.currentUsers.has(message.channel.id)) {
			currentStatus.currentUsers.set(message.channel.id, []);
		}
		const embed = genEmbed('Current Queue:', `${currentStatus.currentUsers.get(message.channel.id).join('\n')}`);
		if (!currentStatus.currentUsers.has(message.channel.id) || currentStatus.currentUsers.get(message.channel.id).length === 0) {
			return message.channel.send(`Nobody currently registered for ${message.channel.toString()}.`);
		}
		return [await message.channel.send({embed})];
	}

}
