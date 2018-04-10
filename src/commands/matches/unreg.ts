/**
 * @module Commands
 */

/** ignore */
import {config, currentStatus, figureOutTeams} from '../../utils';
import * as _ from 'lodash';
import * as Commando from 'discord.js-commando';
import * as Raven from 'raven';
import {basename} from 'path';
import {updateQueues} from '../../queuesUpdate';

Raven.config(config.ravenDSN, {
	autoBreadcrumbs: true,
	dataCallback (data) { // source maps
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

	hasPermission(message) {
		if (!isNaN(figureOutTeams(message.channel))) {
			return true;
		}
		if (!config.allowedChannels.includes(message.channel.id)) {
			return false;
		}
		if (!currentStatus.currentUsers.get(message.channel.id).find(elem => elem.id === message.author.id)) {
			return false;
		}
		return !!currentStatus.currentUsers.get(message.channel.id).find(elem => elem.id === message.author.id)

	}

	async run(message) {
		currentStatus.currentUsers.set(message.channel.id, _.uniq(currentStatus.currentUsers.get(message.channel.id)));
		if (currentStatus.currentUsers.get(message.channel.id).find(elem => elem.id === message.author.id)) {
			_.remove(currentStatus.currentUsers.get(message.channel.id), elem => elem.id === message.author.id);
			console.log(`Unregistered ${message.member.displayName} from #${message.channel.name}.`);
			if (currentStatus.currentUsers.get(message.channel.id).length === 0) {
				currentStatus.queueStartTimes.delete(message.channel.id);
			}
			if (currentStatus.teams.has(message.channel.id) && currentStatus.teams.get(message.channel.id).length === 2) {
				currentStatus.teams.delete(message.channel.id);
				currentStatus.queueTeamTimes.delete(message.channel.id);
				currentStatus.teamsNumber.delete(message.channel.id);
				currentStatus.rerollCount.delete(message.channel.id);
				currentStatus.teamMessage.delete(message.channel.id);
			}
			if (currentStatus.timeouts.has(message.channel.id) && currentStatus.currentUsers.get(message.channel.id).length === 0) {
				clearTimeout(currentStatus.timeouts.get(message.channel.id));
				currentStatus.timeouts.delete(message.channel.id);
			}
			updateQueues()
				.then(() => {

				})
				.catch(err => {
					console.error(err);
					Raven.captureException(err);
				});
			return message.channel.send(`Unregistered ${message.member.displayName}.`);
		}
	}
}
