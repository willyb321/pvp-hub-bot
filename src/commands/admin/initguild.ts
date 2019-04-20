/**
 * @module Commands
 */
/**
 * ignore
 */
import {genEmbed, botLog, initGuildStatus} from '../../utils';
import * as Commando from 'discord.js-commando';
import {Permissions} from 'discord.js';

export class InitGuildCommand extends Commando.Command {
	constructor(client: Commando.Client) {
		super(client, {
			name: 'initguild',
			group: 'admin',
			memberName: 'initguild',
			description: 'Set up a guild.',
			details: 'Set up a guild.',
			examples: ['initguild'],
			guildOnly: true,
			args: [
				{
					label: 'botLogChannel',
					key: 'botLogChannel',
					type: 'channel',
					prompt: 'Bot log channel? (Admins)'
				},
				{
					label: 'queueChannel',
					key: 'queueChannel',
					type: 'channel',
					prompt: 'Queue channel? (Public status)'
				},
				{
					label: 'logJoin',
					key: 'logJoin',
					type: 'boolean',
					prompt: 'Log joins in this server? (To bot log channel)'
				},
				{
					label: 'logLeave',
					key: 'logLeave',
					type: 'boolean',
					prompt: 'Log leaves in this server? (To bot log channel)'
				}
			]
		});
	}

	hasPermission(message: Commando.CommandoMessage) {
		if (!message.member) {
			return false;
		}
		if (message.client.isOwner(message.author)) {
			return true;
		}
		return message.member.hasPermission(Permissions.FLAGS.ADMINISTRATOR);
	}

	async run(msg: Commando.CommandoMessage, args) {
		const guildID = msg.guild.id;
		const botLogID = args.botLogChannel.id;
		const queueChannelID = args.queueChannel.id;
		const logJoins = args.logJoin;
		const logLeaves = args.logLeave;
		await msg.guild.settings.set('logJoins', logJoins);
		await msg.guild.settings.set('logLeaves', logLeaves);
		await msg.guild.settings.set('botLogChannelID', botLogID);
		await msg.guild.settings.set('queueChannelID', queueChannelID);
		initGuildStatus(guildID);
		return botLog(`Now logging in this channel`, msg.guild);
	}
}
