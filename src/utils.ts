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
import consola from 'consola';
import {genMatchModel, IMatch, IMatchDoc, IParticipants} from './db';
import {client} from './index';
import {Message, Permissions, TextChannel} from 'discord.js';
import {updateQueues} from './queuesUpdate';
import {CommandoGuild, CommandoMessage} from "discord.js-commando";
import {Map, List} from 'immutable';

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
const collectors: Discord.ReactionCollector[] = [];

export const genEmbed = (title, desc) => new Discord.MessageEmbed()
	.setTitle(title)
	.setAuthor('PvP Hub Bot', 'https://willb.info/images/2018/08/02/pvphubicon.png')
	.setDescription(desc)
	.setFooter('By Willyb321', 'https://willb.info/images/2018/08/02/pvphubicon.png')
	.setTimestamp();

export const botLog = async (message: string, guild: CommandoGuild) => {
	const logChannelID = guild.settings.get('botLogChannelID', '');
	if (!logChannelID) {
		return;
	}
	const logChannel = guild.channels.get(logChannelID) as Discord.TextChannel;
	if (!logChannel) {
		return;
	}
	return await logChannel.send(message);
};

export interface ICurrentStatus {
	guilds: Map<String, ICurrentStatusGuild>
}

export interface ICurrentStatusGuild {
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
	premadeHappening: boolean;
	collectors: Discord.ReactionCollector[];
	guildID: string;
}

export const initGuildStatus = (guildID: string, force?: boolean) => {
	if (force === true) {
		currentStatus.guilds.delete(guildID);
	}
	if (currentStatus.guilds.has(guildID)) {
		return
	}
	currentStatus.guilds.set(guildID, {
		currentUsers: Map(),
		teams: Map(),
		teamsNumber: Map(),
		teamMessage: Map(),
		locked: Map(),
		queueEndTimes: Map(),
		queueStartTimes: Map(),
		queueTeamTimes: Map(),
		timeouts: Map(),
		rerollCount: Map(),
		premadeHappening: false,
		queueEmbed: genEmbed('Current Queues', 'Updated when queues change.'),
		guildID: guildID,
		collectors: []
	});
};

export const currentStatus: ICurrentStatus = {
	guilds: Map()
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
		return;
	}
	if (client.isOwner(message.author)) {
		return resetCounters(message);
	}
	if (message.member && message.member.hasPermission(Permissions.FLAGS.ADMINISTRATOR)) {
		return resetCounters(message);
	}
	if (!currentStatus.guilds.get(message.guild.id).currentUsers.has(message.channel.id) || !currentStatus.guilds.get(message.guild.id).currentUsers.get(message.channel.id).find(elem => elem.id === message.author.id)) {
		return message.reply('You aren\'t in the session');
	}
	return resetCounters(message);
}

export function resetCounters(message: Message) {
	if (!message.channel) {
		return;
	}
	initGuildStatus(message.guild.id, true);
	collectors.forEach(elem => elem.stop('cleanup'));
	collectors.slice(0, collectors.length);
	updateQueues(message.guild.id)
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
			return teamsNumber;
		}
	} catch (err) {
		console.log(err);
		Raven.captureException(err);
	}
	return teamsNumber;
}

const filterApprove = (reaction, user) => reaction.emoji.name === '✅' && currentStatus.guilds.get(reaction.message.guild.id).currentUsers.get(reaction.message.channel.id).findIndex(elem => elem.id === user.id) > -1;
const filterReroll = (reaction, user) => reaction.emoji.name === '🔄' && currentStatus.guilds.get(reaction.message.guild.id).currentUsers.get(reaction.message.channel.id).findIndex(elem => elem.id === user.id) > -1;

function rolled(message: CommandoMessage, threshold: number) {
	return message.channel.send({embed: currentStatus.guilds.get(message.guild.id).teamMessage.get(message.channel.id)})
		.then((msg: any) => {
			teamsReactionApprove(msg, threshold)
				.then(() => teamsReactionReroll(msg, threshold));
		})
		.catch(err => {
			console.error(err);
			Raven.captureException(err);
		});
}

export function teams(message: CommandoMessage, reroll?: boolean) {
	if (!message.channel || !message.channel.id) {
		return false;
	}
	if (!currentStatus.guilds.get(message.guild.id).currentUsers.has(message.channel.id)) {
		currentStatus.guilds.get(message.guild.id).currentUsers.set(message.channel.id, []);
	}
	if (!currentStatus.guilds.get(message.guild.id).rerollCount.has(message.channel.id)) {
		currentStatus.guilds.get(message.guild.id).rerollCount.set(message.channel.id, 0);
	}
	if (!currentStatus.guilds.get(message.guild.id).locked.has(message.channel.id)) {
		currentStatus.guilds.get(message.guild.id).locked.set(message.channel.id, false);
	}
	if (currentStatus.guilds.get(message.guild.id).locked.get(message.channel.id) === true) {
		return message.reply({embed: currentStatus.guilds.get(message.guild.id).teamMessage.get(message.channel.id)});
	}
	const teamsNumber = figureOutTeams(message.channel as Discord.TextChannel);
	if (currentStatus.guilds.get(message.guild.id).currentUsers.get(message.channel.id).length < teamsNumber * 2) {
		return message.reply('Get some more people!');
	}
	if (collectors.length > 0) {
		collectors.forEach(elem => elem.stop('cleanup'));
		collectors.slice(0, collectors.length);
	}
	const curTeams = currentStatus.guilds.get(message.guild.id).teams.get(message.channel.id);
	const curTeamLength =
		(curTeams && curTeams[0] && curTeams[1]) ?
			currentStatus.guilds.get(message.guild.id).teams.get(message.channel.id)[0].length + currentStatus.guilds.get(message.guild.id).teams.get(message.channel.id)[1].length
			: 0;
	if (currentStatus.guilds.get(message.guild.id).teams.get(message.channel.id).length === 2 && currentStatus.guilds.get(message.guild.id).teams.get(message.channel.id).length !== curTeamLength) {
		reroll = true;
	}
	const threshold = genThreshold(teamsNumber);
	console.log('Threshold: ' + threshold);
	if (currentStatus.guilds.get(message.guild.id).teams.get(message.channel.id).length === 2 && !reroll) {
		return rolled(message, threshold);
	}

	currentStatus.guilds.get(message.guild.id).teamsNumber.set(message.channel.id, teamsNumber);
	console.log(`currentStatus.teamsNumber: ${currentStatus.guilds.get(message.guild.id).teamsNumber.get(message.channel.id)}`);
	currentStatus.guilds.get(message.guild.id).currentUsers.set(message.channel.id, _.shuffle(currentStatus.guilds.get(message.guild.id).currentUsers.get(message.channel.id)));
	currentStatus.guilds.get(message.guild.id).teams.set(message.channel.id, _.chunk(currentStatus.guilds.get(message.guild.id).currentUsers.get(message.channel.id), teamsNumber));
	const embed = genEmbed('Teams: ', '2 teams');
	currentStatus.guilds.get(message.guild.id).teams.get(message.channel.id).forEach((elem: Discord.User[], index) => {
		const inTeam = [];
		elem.forEach((user: Discord.User) => {
			inTeam.push(user.toString());
		});
		embed.addField(`Team ${index + 1}`, inTeam.join('\n'));
	});
	currentStatus.guilds.get(message.guild.id).teamMessage.set(message.channel.id, embed);
	if (!currentStatus.guilds.get(message.guild.id).queueTeamTimes.has(message.channel.id)) {
		currentStatus.guilds.get(message.guild.id).queueTeamTimes.set(message.channel.id, Math.floor(new Date().getSeconds()));
	}
	console.log(currentStatus.guilds.get(message.guild.id).queueTeamTimes.get(message.channel.id));
	return message.channel.send({embed: currentStatus.guilds.get(message.guild.id).teamMessage.get(message.channel.id)})
		.then((msg: any) => {
			teamsReactionApprove(msg, threshold)
				.then(() => teamsReactionReroll(msg, threshold));
		});

}

function teamsReactionReroll(msg: any, threshold: number) {
	return msg.react('🔄')
		.then(() => {
			const reroll = new Discord.ReactionCollector(msg, filterReroll, {maxUsers: threshold});
			collectors.push(reroll);
			reroll.on('end', (elems, reason) => {
				if (reason === 'cleanup') {
					return;
				}
				console.log(`Reroll collector ended with reason: ${reason}`);
				currentStatus.guilds.get(msg.guild.id).rerollCount.set(msg.channel.id, currentStatus.guilds.get(msg.guild.id).rerollCount.get(msg.channel.id) + 1);
				collectors.forEach(elem => elem.stop('cleanup'));
				teams(msg, true);
			});
		})
		.catch(err => {
			console.log(err);
			Raven.captureException(err);
		});
}

function teamsReactionApprove(msg: any, threshold: number) {
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
				const timeToTeam = Math.abs(curTime - currentStatus.guilds.get(msg.guild.id).queueTeamTimes.get(msg.channel.id));
				const participants: IParticipants[] = [];
				const channel: any = msg.channel;
				let lobby;
				try {
					lobby = channel.name;
				} catch (err) {
					console.log(err);
					Raven.captureException(err);
				}
				currentStatus.guilds.get(msg.guild.id).teams.get(msg.channel.id).forEach((elem, ind) => {
					elem.forEach(user => {
						participants.push({id: user.id, team: ind + 1, discordTag: user.tag});
					});
				});
				const matchInfo: IMatch = {
					nanoid: nanoid(12),
					lobby: lobby || 'unknown',
					startQueue: currentStatus.guilds.get(msg.guild.id).queueStartTimes.get(msg.channel.id).toISOString(),
					filledTime: new Date().toISOString(),
					result: 12,
					rerollCount: currentStatus.guilds.get(msg.guild.id).rerollCount.get(msg.channel.id) || 0,
					teamSelectionSec: timeToTeam,
					participants
				};

				const doc = genMatchModel(matchInfo);
				doc.save()
					.then((savedDoc: IMatchDoc) => {
						console.log(`Match #${savedDoc.matchNum} locked in.`);
						msg.channel.send(`Teams locked in. Match ID: ${savedDoc.matchNum}\n${currentStatus.guilds.get(msg.guild.id).currentUsers.get(msg.channel.id).join(' ')}`);
						msg.channel.send({embed: currentStatus.guilds.get(msg.guild.id).teamMessage.get(msg.channel.id)});
						currentStatus.guilds.get(msg.guild.id).queueTeamTimes.delete(msg.channel.id);
						if (savedDoc.matchNum % 100 === 0 || savedDoc.matchNum % 50 === 0) {
							const announce = `Match ${savedDoc.matchNum} reached on ${new Date().toISOString()}`;
							botLog(announce, msg.guild);
						}
					})
					.catch(err => {
						console.log(err);
						Raven.captureException(err);
					});

				currentStatus.guilds.get(msg.guild.id).locked.set(msg.channel.id, true);
				collectors.forEach(elem => elem.stop('cleanup'));
				const timeout = setTimeout(() => {
					resetCounters(msg);
				}, 3000);
				currentStatus.guilds.get(msg.guild.id).timeouts.set(msg.channel.id, timeout);
			});
		})
		.catch(err => {
			console.log(err);
			Raven.captureException(err);
		});
}

function unregFromOtherQueues(channel: TextChannel) {
	let ids = [];
	currentStatus.guilds.get(channel.guild.id).currentUsers.forEach(val => val.forEach(user => ids.push(user.id)));
	ids = ids.filter(elem => {
		return currentStatus.guilds.get(channel.guild.id).currentUsers.get(channel.id).includes(elem);
	});
	currentStatus.guilds.get(channel.guild.id).currentUsers.forEach((val, key) => {
		ids.forEach(id => {
			if (currentStatus.guilds.get(channel.guild.id).currentUsers.get(key).findIndex(elem => elem.id === id) > -1) {
				currentStatus.guilds.get(channel.guild.id).currentUsers.get(key).splice(currentStatus.guilds.get(channel.guild.id).currentUsers.get(key).findIndex(elem => elem.id === id), 1);
			}
		});
	});
}

export function writeLog(message, prefix) {
	if (!prefix) {
		prefix = '[Debug]'; // By default put [Debug] in front of the message
	}
	const logger = consola.withScope(prefix);
	logger.info(message);
}
