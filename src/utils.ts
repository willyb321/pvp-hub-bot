/**
 * @module Utils
 */
/**
 * ignore
 */
import * as Discord from 'discord.js';

export const config = require('../config.json');

export interface IcurrentStatus {
	currentUsers: any;
	teams: any;
	teamsNumber: any;
	teamMessage: any;
	locked: any;
	queueStartTimes: any;
	queueEndTimes: any;
	queueTeamTimes: any;
	timeouts: any;
}

export const currentStatus: IcurrentStatus = {
	currentUsers: {},
	teams: {},
	teamsNumber: {},
	teamMessage: {},
	locked: {},
	queueEndTimes: {},
	queueStartTimes: {},
	queueTeamTimes: {},
	timeouts: {}
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
