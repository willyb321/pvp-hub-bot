/**
 * @module Commands
 */
/**
 * ignore
 */
import * as Commando from 'discord.js-commando';

const botAccessID = '406812683736842281';

export class CustomSetCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'setcustom',
			aliases: ['sc'],
			group: 'misc',
			memberName: 'setcustom',
			description: 'Custom commands.',
			examples: ['custom add<enter>'],
			guildOnly: true,

			args: [
				{
					key: 'name',
					prompt: 'Command name? (Will be called by ?c[ustom] <name>',
					type: 'string',
					infinite: false,
					wait: 60
				},
				{
					key: 'text',
					prompt: 'Command text? (Will be printed when called)',
					type: 'string',
					wait: 60
				}
			]
		});
	}

	hasPermission(msg) {
		if (!msg || !msg.member) {
			return false;
		}
		return !!msg.member.roles.get(botAccessID);
	}

	async run(msg, args) {
		if (!msg.client) {
			return;
		}
		const provider = msg.client.provider;
		if (!provider) {
			return;
		}
		const guild = msg.guild;
		const name = args.name.toLowerCase();
		const val = args.text;
		console.log(val);
		return provider.set(guild, name, val)
			.then(() => {
				console.log(`Added custom command ${name}`);
				return msg.reply(`Added custom command ${name}`);
			})
			.catch(err => {
				console.error(err);
				return msg.reply('Had an error! Contact willyb321#2816.');
			});

	}
}
