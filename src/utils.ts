/**
 * @module Utils
 */
/**
 * ignore
 */
import * as Discord from 'discord.js';
import * as Commando from 'discord.js-commando';
import {basename} from 'path';
import * as Raven from 'raven';

import {config} from './config';
import {TextChannel} from 'discord.js';
export {config} from './config';

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

export const genEmbed = (title, desc) => new Discord.RichEmbed()
	.setTitle(title)
	.setAuthor('PvP Hub Bot', 'https://willb.info/i/822a4be1252dd25c0632e584f0d016c3')
	.setDescription(desc)
	.setFooter('By Willyb321', 'https://willb.info/i/2167372b54bbaf90900a8205a28f3733')
	.setTimestamp();

export interface ICurrentStatus {
	currentUsers: Map<string, Discord.User[]>;
	teams: Map<string, Discord.User[][]>;
	teamsNumber: Map<string, number>;
	teamMessage: Map<string, Discord.RichEmbed>;
	locked: Map<string, boolean>;
	queueStartTimes: Map<string, Date>;
	queueEndTimes: Map<string, Date>;
	queueTeamTimes: Map<string, number>;
	timeouts: Map<string, any>;
	rerollCount: Map<string, number>;
	queueEmbed: Discord.RichEmbed;
}

export const currentStatus: ICurrentStatus = {
	currentUsers: new Map(),
	teams: new Map(),
	teamsNumber: new Map(),
	teamMessage: new Map(),
	locked: new Map(),
	queueEndTimes: new Map(),
	queueStartTimes: new Map(),
	queueTeamTimes: new Map(),
	timeouts: new Map(),
	rerollCount: new Map(),
	queueEmbed: genEmbed('Current Queues', 'Updated when queues change.')
};

export const chunk = (target, size) => {
	return target.reduce((memo, value, index) => {
		// Here it comes the only difference
		if (index % (target.length / size) == 0 && index !== 0) {
			memo.push([]);
		}
		memo[memo.length - 1].push(value);
		return memo;
	}, [[]]);
};



export const genThreshold = teamsNumber => Math.floor((75 / 100) * (teamsNumber * 2));

export function figureOutTeams(channel: TextChannel | Commando.CommandoMessage): number {
	let teamsNumber: number;
	if ((<Commando.CommandoMessage>channel).channel) {
		channel = channel.channel;
	}
	try {
		if (channel.type !== 'text') {
			return;
		}
		teamsNumber = parseInt(channel.name.split('v')[0]);
		if (isNaN(teamsNumber)) {
			return NaN;
		}
	} catch (err) {
		console.log(err);
		Raven.captureException(err);
	}
	return teamsNumber;
}
