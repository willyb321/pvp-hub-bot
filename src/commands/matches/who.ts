/**
 * @module Commands
 */
/**
 * ignore
 */
import {config, currentStatus, figureOutTeams, genEmbed} from '../../utils';
import * as Commando from 'discord.js-commando';
import {basename} from 'path';
import * as Raven from 'raven';

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

export class WhoCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'who',
			aliases: ['whomst'],
			group: 'matches',
			memberName: 'who',
			description: 'Gets queue for current channel.',
			details: 'Gets queue for current channel.',
			examples: ['who']
		});
	}

	hasPermission(msg) {
		if (!msg || !msg.channel || !msg.channel.id) {
			return false;
		}
		return !isNaN(figureOutTeams(msg.channel));

	}

	async run(message) {
		if (!currentStatus.guilds.get(message.guild.id).currentUsers.has(message.channel.id)) {
			currentStatus.guilds.get(message.guild.id).currentUsers.set(message.channel.id, []);
		}
		console.log(`Who command run in #${message.channel.name}`);
		const embed = genEmbed('Current Queue:', `${currentStatus.guilds.get(message.guild.id).currentUsers.get(message.channel.id).join('\n')}`);
		if (!currentStatus.guilds.get(message.guild.id).currentUsers.has(message.channel.id) || currentStatus.guilds.get(message.guild.id).currentUsers.get(message.channel.id).length === 0) {
			return message.channel.send(`Nobody currently registered for ${message.channel.toString()}.`);
		}
		return message.channel.send({embed});
	}

}
