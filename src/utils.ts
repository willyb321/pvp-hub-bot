/**
 * @module Utils
 */
/**
 * ignore
 */
import * as Discord from 'discord.js';
import {basename} from 'path';
import * as Raven from 'raven';
import * as nanoid from 'nanoid';
import * as _ from 'lodash';
import {config} from './config';
export {config} from './config';

import {genMatchModel, IMatch, IMatchDoc, IParticipants} from "./db";
import {client} from "./index";
import {Message} from "discord.js";
import {updateQueues} from "./queuesUpdate";


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
export const collectors: Discord.ReactionCollector[] = [];


export const genEmbed = (title, desc) => new Discord.MessageEmbed()
	.setTitle(title)
	.setAuthor('PvP Hub Bot', 'https://willb.info/i/822a4be1252dd25c0632e584f0d016c3')
	.setDescription(desc)
	.setFooter('By Willyb321', 'https://willb.info/i/2167372b54bbaf90900a8205a28f3733')
	.setTimestamp();

export interface ICurrentStatus {
	currentUsers: Map<string, Discord.User[]>;
	teams: Map<string, Discord.User[][]>;
	teamsNumber: Map<string, number>;
	teamMessage: Map<string, Discord.MessageEmbed>;
	locked: Map<string, boolean>;
	queueStartTimes: Map<string, Date>;
	queueEndTimes: Map<string, Date>;
	queueTeamTimes: Map<string, number>;
	timeouts: Map<string, any>;
	rerollCount: Map<string, number>;
	queueEmbed: Discord.MessageEmbed;
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

export function reset(message: Message, timeout?: boolean) {
	if (timeout) {
		return resetCounters(message);
	}
	if (!message.channel) {
		return
	}
	if (message.member && message.member.roles.find(elem => config.allowedRoles.includes(elem.id))) {
		return resetCounters(message);
	}
	if (!currentStatus.currentUsers.has(message.channel.id) || !currentStatus.currentUsers.get(message.channel.id).find(elem => elem.id === message.author.id)) {
		return message.reply('You aren\'t in the session');
	}
	return resetCounters(message);
}

export function resetCounters(message: Message) {
	if (!message.channel) {
		return;
	}
	currentStatus.currentUsers.set(message.channel.id, []);
	currentStatus.teams.set(message.channel.id, []);
	if (currentStatus.timeouts.has(message.channel.id)) {
		clearTimeout(currentStatus.timeouts.get(message.channel.id));
	}
	currentStatus.timeouts.delete(message.channel.id);
	currentStatus.locked.delete(message.channel.id);
	currentStatus.teamMessage.delete(message.channel.id);
	currentStatus.teams.delete(message.channel.id);
	currentStatus.teamsNumber.delete(message.channel.id);
	currentStatus.queueStartTimes.delete(message.channel.id);
	currentStatus.queueEndTimes.delete(message.channel.id);
	currentStatus.queueTeamTimes.delete(message.channel.id);
	collectors.forEach(elem => elem.stop('cleanup'));
	collectors.slice(0, collectors.length);
	updateQueues()
		.catch(err => {
			console.error(err);
			Raven.captureException(err);
		});
	return message.channel.send('New session created.');
}


export const genThreshold = teamsNumber => Math.floor((75 / 100) * (teamsNumber * 2));

export function figureOutTeams(channel: Discord.TextChannel): number {
	let teamsNumber: number;
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

const filterApprove = (reaction, user) => reaction.emoji.name === '✅' && currentStatus.currentUsers.get(reaction.message.channel.id).findIndex(elem => elem.id === user.id) > -1;
const filterReroll = (reaction, user) => reaction.emoji.name === '🔄' && currentStatus.currentUsers.get(reaction.message.channel.id).findIndex(elem => elem.id === user.id) > -1;

function rolled(message: Discord.Message, threshold: number) {
	return message.channel.send({embed: currentStatus.teamMessage.get(message.channel.id)})
		.then((msg: Discord.Message) => {
			teamsReactionApprove(msg, threshold)
				.then(() => teamsReactionReroll(msg, threshold));
		})
		.catch(err => {
			console.error(err);
			Raven.captureException(err);
		});
}

export function teams(message: Discord.Message, reroll?: boolean) {
	if (!message.channel || !message.channel.id) {
		return false;
	}
	if (!currentStatus.currentUsers.has(message.channel.id)) {
		currentStatus.currentUsers.set(message.channel.id, []);
	}
	if (!currentStatus.rerollCount.has(message.channel.id)) {
		currentStatus.rerollCount.set(message.channel.id, 0);
	}
	if (!currentStatus.locked.has(message.channel.id)) {
		currentStatus.locked.set(message.channel.id, false);
	}
	if (currentStatus.locked.get(message.channel.id) === true) {
		return message.reply({embed: currentStatus.teamMessage.get(message.channel.id)});
	}
	const teamsNumber = figureOutTeams(message.channel as Discord.TextChannel);
	if (currentStatus.currentUsers.get(message.channel.id).length < teamsNumber * 2) {
		return message.reply('Get some more people!');
	}
	if (collectors.length > 0) {
		collectors.forEach(elem => elem.stop('cleanup'));
		collectors.slice(0, collectors.length);
	}
	const curTeams = currentStatus.teams.get(message.channel.id);
	const curTeamLength =
		(curTeams && curTeams[0] && curTeams[1]) ?
			currentStatus.teams.get(message.channel.id)[0].length + currentStatus.teams.get(message.channel.id)[1].length
			: 0;
	if (currentStatus.teams.get(message.channel.id).length === 2 && currentStatus.teams.get(message.channel.id).length !== curTeamLength) {
		reroll = true;
	}
	const threshold = genThreshold(teamsNumber);
	console.log('Threshold: ' + threshold);
	if (currentStatus.teams.get(message.channel.id).length === 2 && !reroll) {
		return rolled(message, threshold);
	}

	currentStatus.teamsNumber.set(message.channel.id, teamsNumber);
	console.log(`currentStatus.teamsNumber: ${currentStatus.teamsNumber.get(message.channel.id)}`);
	currentStatus.currentUsers.set(message.channel.id, _.shuffle(currentStatus.currentUsers.get(message.channel.id)));
	currentStatus.teams.set(message.channel.id, _.chunk(currentStatus.currentUsers.get(message.channel.id), teamsNumber));
	const embed = genEmbed('Teams: ', '2 teams');
	currentStatus.teams.get(message.channel.id).forEach((elem: Discord.User[], index) => {
		const inTeam = [];
		elem.forEach((user: Discord.User) => {
			inTeam.push(user.toString());
		});
		embed.addField(`Team ${index + 1}`, inTeam.join('\n'));
	});
	currentStatus.teamMessage.set(message.channel.id, embed);
	if (!currentStatus.queueTeamTimes.has(message.channel.id)) {
		currentStatus.queueTeamTimes.set(message.channel.id, Math.floor(new Date().getSeconds()));
	}
	console.log(currentStatus.queueTeamTimes.get(message.channel.id));
	return message.channel.send({embed: currentStatus.teamMessage.get(message.channel.id)})
		.then((msg: Discord.Message) => {
			teamsReactionApprove(msg, threshold)
				.then(() => teamsReactionReroll(msg, threshold));
		});

}

function teamsReactionReroll(msg: Discord.Message, threshold: number) {
	return msg.react('🔄')
		.then(() => {
			const reroll = new Discord.ReactionCollector(msg, filterReroll, {maxUsers: threshold});
			collectors.push(reroll);
			reroll.on('end', (elems, reason) => {
				if (reason === 'cleanup') {
					return;
				}
				console.log(`Reroll collector ended with reason: ${reason}`);
				currentStatus.rerollCount.set(msg.channel.id, currentStatus.rerollCount.get(msg.channel.id) + 1);
				collectors.forEach(elem => elem.stop('cleanup'));
				teams(msg, true);
			});
		})
		.catch(err => {
			console.log(err);
			Raven.captureException(err);
		});
}

function teamsReactionApprove(msg: Discord.Message, threshold: number) {
	return msg.react('✅')
		.then(() => {
			const reroll = new Discord.ReactionCollector(msg, filterApprove, {maxUsers: threshold});
			collectors.push(reroll);
			reroll.on('end', (elems, reason) => {
				if (reason === 'cleanup') {
					return;
				}
				console.log(`Approve collector ended with reason: ${reason}`);
				unregFromOtherQueues(msg.channel);
				const curTime = Math.floor(new Date().getSeconds());
				const timeToTeam = Math.abs(curTime - currentStatus.queueTeamTimes.get(msg.channel.id));
				const participants: IParticipants[] = [];
				const channel: any = msg.channel;
				let lobby;
				try {
					lobby = channel.name;
				} catch (err) {
					console.log(err);
					Raven.captureException(err);
				}
				currentStatus.teams.get(msg.channel.id).forEach((elem, ind) => {
					elem.forEach(user => {
						participants.push({id: user.id, team: ind + 1, discordTag: user.tag});
					});
				});
				const matchInfo: IMatch = {
					nanoid: nanoid(12),
					lobby: lobby || 'unknown',
					startQueue: currentStatus.queueStartTimes.get(msg.channel.id).toISOString(),
					filledTime: new Date().toISOString(),
					result: 12,
					rerollCount: currentStatus.rerollCount.get(msg.channel.id) || 0,
					teamSelectionSec: timeToTeam,
					participants
				};

				const doc = genMatchModel(matchInfo);
				doc.save()
					.then((savedDoc: IMatchDoc) => {
						console.log(`Match #${savedDoc.matchNum} locked in.`);
						msg.channel.send(`Teams locked in. Match ID: ${savedDoc.matchNum}\n${currentStatus.currentUsers.get(msg.channel.id).join(' ')}`);
						msg.channel.send({embed: currentStatus.teamMessage.get(msg.channel.id)});
						currentStatus.queueTeamTimes.delete(msg.channel.id);
						if (savedDoc.matchNum % 100 === 0 || savedDoc.matchNum % 50 === 0) {
							const botLogChannel = client.channels.get(config.botLogID) as Discord.TextChannel;
							const logToBotSpam = msg => botLogChannel.send(msg);
							const announce = `Match ${savedDoc.matchNum} reached on ${new Date().toISOString()}`;
							logToBotSpam(announce);
						}
					})
					.catch(err => {
						console.log(err);
						Raven.captureException(err);
					});

				currentStatus.locked.set(msg.channel.id, true);
				collectors.forEach(elem => elem.stop('cleanup'));
				const timeout = setTimeout(() => {
					resetCounters(msg);
				}, 3000);
				currentStatus.timeouts.set(msg.channel.id, timeout);
			});
		})
		.catch(err => {
			console.log(err);
			Raven.captureException(err);
		});
}

function unregFromOtherQueues(channel) {
	let ids = [];
	currentStatus.currentUsers.forEach(val => val.forEach(user => ids.push(user.id)));
	ids = ids.filter(elem => {
		return currentStatus.currentUsers.get(channel.id).includes(elem);
	});
	currentStatus.currentUsers.forEach((val, key) => {
		ids.forEach(id => {
			if (currentStatus.currentUsers.get(key).findIndex(elem => elem.id === id) > -1) {
				currentStatus.currentUsers.get(key).splice(currentStatus.currentUsers.get(key).findIndex(elem => elem.id === id), 1);
			}
		});
	});
}
