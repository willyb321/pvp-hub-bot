/**
 * @module Commands
 */
/**
 * ignore
 */
import * as Commando from 'discord.js-commando';

export class CustomGetCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'listcustom',
			aliases: ['lc'],
			group: 'misc',
			memberName: 'listcustom',
			description: 'List custom commands.',
			examples: ['listcustom', 'lc'],
			guildOnly: true
		});
	}

	async run(msg, args) {
		if (!msg.client || !msg.guild) {
			return;
		}
		const provider = msg.client.provider;
		if (!provider) {
			return;
		}
		if (!provider.db) {
			return;
		}
		const truncateString = (str, num) =>
			str.length > num ? str.slice(0, num > 3 ? num - 3 : num) + '...' : str;
		return msg.client.provider.db.get('SELECT settings FROM settings WHERE guild = ?', msg.guild.id)
			.then(elem => {
				try {
					elem = JSON.parse(elem.settings);
					const keys = Object.keys(elem);
					let reply = 'Custom commands list:\n';
					keys.forEach(key => reply += `${key} - ${truncateString(elem[key], 35)}\n`);
					return msg.channel.send(reply);
				} catch (err) {
					console.error(err);
					return msg.channel.send('Had an error. Contact willyb321#2816');
				}
			})
			.catch(err => {
				console.error(err);
				return msg.channel.send('Had an error. Contact willyb321#2816');
			});
	}
}
