/**
 * @module Commands
 */
/**
 * ignore
 */
import * as Discord from 'discord.js';
import {genEmbed} from "../../utils";
import * as Commando from 'discord.js-commando';

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
