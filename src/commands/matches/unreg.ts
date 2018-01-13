/**
 * @module Commands
 */

/** ignore */
import {config, currentStatus} from '../../utils';
import * as _ from 'lodash';
import {teams} from './teams';
import * as Commando from 'discord.js-commando';

export class UnregCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'unreg',
			group: 'matches',
			memberName: 'unreg',
			description: 'Unregister yourself in the queue.',
			details: 'Unregister yourself in the queue.',
			examples: ['unreg']
		});
	}

	async run(message) {
		if (!config.allowedChannels.includes(message.channel.id)) {
			return;
		}
		currentStatus.currentUsers.set(message.channel.id, _.uniq(currentStatus.currentUsers.get(message.channel.id)));
		if (currentStatus.currentUsers.get(message.channel.id).find(elem => elem.id === message.author.id)) {
			_.remove(currentStatus.currentUsers.get(message.channel.id), elem => elem.id === message.author.id);
			message.channel.send(`Unregistered ${message.member.displayName}.`);
			if (currentStatus.currentUsers.get(message.channel.id).length === 0) {
				currentStatus.queueStartTimes.delete(message.channel.id);
			}
			if (currentStatus.teams.has(message.channel.id) && currentStatus.teams.get(message.channel.id).length === 2) {
				if (currentStatus.currentUsers.get(message.channel.id).length !== currentStatus.teams.get(message.channel.id)[0].length + currentStatus.teams.get(message.channel.id)[1].length)
					teams(message);
			}
			return;
		}
	}
}
