/**
 * @module Commands
 */
/**
 * ignore
 */
import * as Discord from 'discord.js';
import {config, genEmbed} from "../../utils";
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


export class StatusCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'status',
			group: 'misc',
			memberName: 'status',
			description: 'Gets current info in bot.',
			details: 'This command is under construction.',
			examples: ['status']
		});
	}

	async run(msg, args) {
		const embed = genEmbed('PvP Hub Bot', 'PvP Hub Bot Status');
		embed
			.addField('//TODO', 'Add some stuff here.');
		return msg.channel.send({embed});
	}

}
