/**
 * @module Commands
 */
/**
 * ignore
 */
import {currentStatus, config} from '../../utils';
import * as Discord from 'discord.js';
import {collectors} from './teams';
import * as Commando from 'discord.js-commando';


export class NewCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'new',
			group: 'matches',
			memberName: 'new',
			description: 'Resets current channel queue.',
			details: 'Resets current channel queue.',
			examples: ['new']
		});
	}

	async run(message) {
		reset(message);
	}

}


export function reset(message: Commando.CommandoMessage, timeout?: boolean) {
	if (timeout) {
		return resetCounters(message);
	}
	if (!message.channel) {
		return;
	}
	if (message.member && message.member.roles.find(elem => config.allowedRoles.includes(elem.id))) {
		return resetCounters(message);
	}
	if (!currentStatus.currentUsers.has(message.channel.id) || !currentStatus.currentUsers.get(message.channel.id).find(elem => elem.id === message.author.id)) {
		return message.reply('You aren\'t in the session');
	}
	return resetCounters(message);
}

function resetCounters(message: Commando.CommandoMessage) {
	if (!message.message) {
		return;
	}
	currentStatus.currentUsers.set(message.message.channel.id, []);
	currentStatus.teams.set(message.message.channel.id, []);
	if (currentStatus.timeouts.has(message.message.channel.id)) {
		clearTimeout(currentStatus.timeouts.get(message.message.channel.id));
	}
	currentStatus.timeouts.delete(message.message.channel.id);
	currentStatus.locked.delete(message.message.channel.id);
	currentStatus.teamMessage.delete(message.message.channel.id);
	currentStatus.teamsNumber.delete(message.message.channel.id);
	currentStatus.queueStartTimes.delete(message.message.channel.id);
	currentStatus.queueEndTimes.delete(message.message.channel.id);
	currentStatus.queueTeamTimes.delete(message.message.channel.id);
	collectors.forEach(elem => elem.cleanup());
	collectors.slice(0, collectors.length);
	return message.channel.send('New session created.');
}
