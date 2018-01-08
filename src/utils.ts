/**
 * @module Utils
 */
/**
 * ignore
 */
import * as Datastore from 'nedb';
import * as Discord from 'discord.js';
import {client} from './index';

export const config = require('../config.json');



export interface IcurrentStatus {
	currentUsers: any;
	teams: any;
	teamsNumber: any;
	teamMessage: any;
	locked: any;
}

export const currentStatus: IcurrentStatus = {
	currentUsers: {},
	teams: {},
	teamsNumber: {},
	teamMessage: {},
	locked: {}
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
		.setAuthor('PvP Hub Bot', 'https://willb.info/i/face45a7d6378b600bda26bf69e531d7')
		.setDescription(desc)
		.setFooter('By Willyb321', 'https://willb.info/i/22f73495510de53cb95cba9615549bc9')
		.setTimestamp();
