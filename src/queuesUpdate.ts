import {config, currentStatus, genEmbed} from './utils';
import {client} from './index';
import * as Raven from 'raven';
import {TextChannel} from 'discord.js';

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
		msg = await queueChannel.fetchMessage(msgIDToEdit);
	}
	if (!currentStatus.queueEmbed) {
		currentStatus.queueEmbed = genEmbed('Current Queues', 'Updated when queues change.');
	}

	let counts: any = [];
	for (const [key, val] of currentStatus.currentUsers) {
		let teamsNumber: number;
		try {
			const channel = client.guilds.get(config.allowedServers[0]).channels.get(key);
			teamsNumber = parseInt(channel.name.split('v')[0]);
		} catch (err) {
			console.log(err);
			Raven.captureException(err);
		}
		currentStatus.teamsNumber.set(key, teamsNumber);
		counts.push({channel: key, count: val.length});
	}
	counts = counts.sort((a, b) => client.guilds.get(config.allowedServers[0]).channels.get(a.channel).name > client.guilds.get(config.allowedServers[0]).channels.get(b.channel).name === true);
	let embedString = '';
	counts.forEach(elem => {
		embedString += `<#${elem.channel}> - ${elem.count} / ${currentStatus.teamsNumber.get(elem.channel) * 2}\n`;
	});
	currentStatus.queueEmbed = genEmbed('Current Queues:', embedString);
	if (send) {
		return queueChannel.send({embed: currentStatus.queueEmbed});
	} else {
		msg.edit('Queues: ', {embed: currentStatus.queueEmbed})
			.catch(err => {
				console.error(err);
				Raven.captureException(err);
				queueChannel.send({embed: currentStatus.queueEmbed});
			})
	}
}
