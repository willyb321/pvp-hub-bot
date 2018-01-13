/**
 * @module Utils
 */
/**
 * ignore
 */
import * as Discord from 'discord.js';

export const config = require('../config.json');

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
	rerollCount: new Map()
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

export const genEmbed = (title, desc) => new Discord.RichEmbed()
		.setTitle(title)
		.setAuthor('PvP Hub Bot', 'https://willb.info/i/822a4be1252dd25c0632e584f0d016c3')
		.setDescription(desc)
		.setFooter('By Willyb321', 'https://willb.info/i/2167372b54bbaf90900a8205a28f3733')
		.setTimestamp();
