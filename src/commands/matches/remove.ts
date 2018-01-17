/**
 * @module Commands
 */
/**
 * ignore
 */
import {currentStatus, config} from '../../utils';
import * as Discord from 'discord.js';
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


export class RemoveCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'remove',
			group: 'matches',
			memberName: 'remove',
			description: '[Mod] Remove user from queue.',
			details: '[Mod] Remove user from queue.',
			examples: ['remove @willyb321#2816'],

			args: [
				{
					key: 'user',
					prompt: 'What user to remove?',
					type: 'member'
				}
			]
		});
	}

	async run(message, args) {
		if (!config.allowedChannels.includes(message.channel.id)) {
			return;
		}
		if (!message.member || !message.member.roles.find(elem => config.allowedRoles.includes(elem.id))) {
			console.log('No perms');
			return;
		}
		if (!args.user) {
			return message.reply('Nobody specified to remove')
		}
		if (!currentStatus.currentUsers.get(message.channel.id).find(elem => elem.id === args.user.id)) {
			return message.reply('User isn\'t registered.');
		}
		const currentUsers = currentStatus.currentUsers.get(message.channel.id);
		currentStatus.currentUsers.get(message.channel.id).splice(currentUsers.findIndex(elem => elem.id === args.user.id), 1);
		if (!currentStatus.currentUsers.has(message.channel.id)) {
			currentStatus.queueStartTimes.delete(message.channel.id);
		}
		message.channel.send(`:ok_hand: ${args.user.displayName} removed.`);
	}

}
