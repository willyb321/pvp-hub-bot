/**
 * @module Utils
 */
/**
 * ignore
 */
import {config, currentStatus, figureOutTeams, genEmbed} from './utils';
import {client} from './index';
import * as consola from 'consola';

import * as Raven from 'raven';
import {TextChannel, Message} from 'discord.js';

export async function updateQueues() {
	const queueChannel = client.channels.get(config.queueChannelID) as TextChannel;
	if (!queueChannel) {
		return;
	}
	let send = false;
	let msg;
	const msgIDToEdit = queueChannel.lastMessageID;
	if (!msgIDToEdit) {
		send = true;
	} else {
		msg = await queueChannel.messages.fetch(msgIDToEdit);
	}
	if (!currentStatus.queueEmbed) {
		currentStatus.queueEmbed = genEmbed('Current Queues', 'Updated when queues change.');
	}

	let counts: any = [];
	for (const [key, val] of currentStatus.currentUsers) {
		let teamsNumber: number;
		const channel = client.channels.get(key) as TextChannel;
		teamsNumber = figureOutTeams(channel);
		currentStatus.teamsNumber.set(key, teamsNumber);
		counts.push({channel: key, count: val.length});
	}
	counts = counts.sort((a, b) => client.guilds.get(config.allowedServers[0]).channels.get(a.channel).name.localeCompare(client.guilds.get(config.allowedServers[0]).channels.get(b.channel).name));
	let embedString = '';
	for (const elem of counts) {
		embedString += `<#${elem.channel}> - ${elem.count} / ${currentStatus.teamsNumber.get(elem.channel) * 2}\n`;
	}
	currentStatus.queueEmbed = genEmbed('Current Queues:', embedString);
	if (send) {
		return queueChannel.send('Queues: ', {embed: currentStatus.queueEmbed});
	} else {
		msg.edit('Queues: ', {embed: currentStatus.queueEmbed})
			.catch(err => {
				consola.error(err);
				Raven.captureException(err);
				queueChannel.send({embed: currentStatus.queueEmbed});
			});
	}
}
