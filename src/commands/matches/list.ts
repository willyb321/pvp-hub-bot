/**
 * @module Commands
 */
/**
 * ignore
 */
import {config, currentStatus, genEmbed} from '../../utils';
import * as Commando from 'discord.js-commando';
import {basename} from "path";
import * as Raven from "raven";
import { client } from '../../index';

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


export class WhoCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'ls',
			group: 'matches',
			memberName: 'ls',
			description: 'Gets queue counts for all channels.',
			details: 'Gets queue counts for all channels.',
			examples: ['ls']
		});
	}

	async run(message) {
		if (!config.allowedChannels.includes(message.channel.id)) {
			return;
		}
		if (!currentStatus.currentUsers.has(message.channel.id)) {
			currentStatus.currentUsers.set(message.channel.id, []);
		}

		let counts: any = [];
		for (const [key, val] of currentStatus.currentUsers) {
			let teamsNumber: number;
			try {
				if (message.channel.type !== 'text') {
					return;
				}
				const channel: any = client.guilds.get(config.allowedServers[0]).channels.get(key);
				teamsNumber = parseInt(channel.name.split('v')[0]);
			} catch (err) {
				console.log(err);
				Raven.captureException(err);
			}
			currentStatus.teamsNumber.set(key, teamsNumber);
			counts.push({channel: key, count: val.length})
		}
		counts = counts.sort((a,b) => client.guilds.get(config.allowedServers[0]).channels.get(a.channel).name > client.guilds.get(config.allowedServers[0]).channels.get(b.channel).name === true )
		let embedString = '';
		counts.forEach(elem => {
			embedString += `<#${elem.channel}> - ${elem.count} / ${currentStatus.teamsNumber.get(elem.channel) * 2}\n`;
		})
		const embed = genEmbed('Current Queues:', embedString);

		return [await message.channel.send({embed})];
	}

}