/**
 * @module Utils
 */
/**
 * ignore
 */
import {config, currentStatus, figureOutTeams, genEmbed, initGuildStatus} from './utils';
import {client} from './index';
import consola from 'consola';

import * as Raven from 'raven';
import {TextChannel, Message} from 'discord.js';
import {CommandoGuild} from "discord.js-commando";

export async function updateQueues(guildID: string) {
	const guild: CommandoGuild = client.guilds.get(guildID);
	if (!guild) {
		return;
	}
	initGuildStatus(guildID);
	const queueChannelID = guild.settings.get('queueChannelID', '');
	const queueChannel = client.channels.get(queueChannelID) as TextChannel;
	if (!queueChannel) {
		return;
	}
	let send = false;
	let msg;
	const msgIDToEdit = queueChannel.lastMessageID;
	if (!msgIDToEdit) {
		send = true;
	} else {
		try {
			msg = await queueChannel.messages.fetch(msgIDToEdit);
		} catch (err) {
			console.error(err);
			send = true;
		}
	}
	if (!currentStatus.guilds.get(guildID).queueEmbed) {
		const queueEmbed =  genEmbed('Current Queues', 'Updated when queues change.');
		currentStatus.guilds.updateIn([guildID, 'queueEmbed'], () => queueEmbed);
	}

	let counts: any = [];
	for (const [key, val] of currentStatus.guilds.get(guildID).currentUsers) {
		let teamsNumber: number;
		const channel = client.channels.get(key) as TextChannel;
		teamsNumber = figureOutTeams(channel);
		currentStatus.guilds.get(guildID).teamsNumber.set(key, teamsNumber);
		counts.push({channel: key, count: val.length});
	}
	counts = counts.sort((a, b) => client.guilds.get(guildID).channels.get(a.channel).name.localeCompare(client.guilds.get(guildID).channels.get(b.channel).name));
	let embedString = '';
	for (const elem of counts) {
		embedString += `<#${elem.channel}> - ${elem.count} / ${currentStatus.guilds.get(guildID).teamsNumber.get(elem.channel) * 2}\n`;
	}
	const embed = genEmbed('Current Queues:', embedString);
	currentStatus.guilds.updateIn([guildID, 'queueEmbed'], () => embed);
	if (send) {
		return queueChannel.send('Queues: ', {embed: currentStatus.guilds.get(guildID).queueEmbed});
	} else {
		msg.edit('Queues: ', {embed: currentStatus.guilds.get(guildID).queueEmbed})
			.catch(err => {
				consola.error(err);
				Raven.captureException(err);
				queueChannel.send({embed: currentStatus.guilds.get(guildID).queueEmbed});
			});
	}
}
