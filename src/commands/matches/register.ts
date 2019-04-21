/**
 * @module Commands
 */
/**
 * ignore
 */
import {currentStatus, config, figureOutTeams} from '../../utils';
import * as Raven from 'raven';
import {teams} from '../../utils';
import * as Commando from 'discord.js-commando';
import {basename} from 'path';
import {resetCounters} from '../../utils';
import {updateQueues} from '../../queuesUpdate';

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

export class RegisterCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'reg',
			group: 'matches',
			memberName: 'reg',
			description: 'Register yourself for current channel queue.',
			details: 'Register yourself for current channel queue.',
			examples: ['reg']
		});
	}
	hasPermission(message) {
		return !isNaN(figureOutTeams(message.channel));
	}
	async run(message) {
		if (!currentStatus.guilds.get(message.guild.id).currentUsers.has(message.channel.id)) {
			currentStatus.guilds.get(message.guild.id).currentUsers.set(message.channel.id, []);
		}
		if (!currentStatus.guilds.get(message.guild.id).queueStartTimes.has(message.channel.id)) {
			currentStatus.guilds.get(message.guild.id).queueStartTimes.set(message.channel.id, new Date());
		}
		const teamsNumber = currentStatus.guilds.get(message.guild.id).teamsNumber.get(message.channel.id);
		if (!teamsNumber) {
			const teamsNumber = figureOutTeams(message.channel);
			currentStatus.guilds.get(message.guild.id).teamsNumber.set(message.channel.id, teamsNumber);
		}
		if (!currentStatus.guilds.get(message.guild.id).teams.has(message.channel.id)) {
			currentStatus.guilds.get(message.guild.id).teams.set(message.channel.id, []);
		}

		if (currentStatus.guilds.get(message.guild.id).currentUsers.get(message.channel.id).length >= teamsNumber * 2) {
			return message.reply('Full!');
		} else if (!currentStatus.guilds.get(message.guild.id).currentUsers.get(message.channel.id).find(elem => elem === message.author)) {
			currentStatus.guilds.get(message.guild.id).currentUsers.get(message.channel.id).push(message.author);
			updateQueues(message.guild.id)
				.then(() => {

				})
				.catch(err => {
					console.error(err);
					Raven.captureException(err);
				});
			await message.reply(`Added to the session\nCurrently registered: ${currentStatus.guilds.get(message.guild.id).currentUsers.get(message.channel.id).length} / ${currentStatus.guilds.get(message.guild.id).teamsNumber.get(message.channel.id) * 2}`);
			if (currentStatus.guilds.get(message.guild.id).timeouts.has(message.channel.id)) {
				clearTimeout(currentStatus.guilds.get(message.guild.id).timeouts.get(message.channel.id));
				currentStatus.guilds.get(message.guild.id).timeouts.delete(message.channel.id);
			}
			const timeout = setTimeout(() => {
				resetCounters(message);
			}, 5400000);
			currentStatus.guilds.get(message.guild.id).timeouts.set(message.channel.id, timeout);
			if (currentStatus.guilds.get(message.guild.id).currentUsers.get(message.channel.id).length === teamsNumber * 2) {
				message.channel.send(`Initial Teams Ready. Pinging.\n${currentStatus.guilds.get(message.guild.id).currentUsers.get(message.channel.id).join(' ')}`);
				if (currentStatus.guilds.get(message.guild.id).timeouts.has(message.channel.id)) {
					clearTimeout(currentStatus.guilds.get(message.guild.id).timeouts.get(message.channel.id));
					currentStatus.guilds.get(message.guild.id).timeouts.delete(message.channel.id);
				}
				teams(message);
			}
			return;
		} else if (currentStatus.guilds.get(message.guild.id).currentUsers.get(message.channel.id).find(elem => elem === message.author)) {
			return message.reply('Already in the session.');
		}
	}

}
