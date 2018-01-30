/**
 * @module Commands
 */
/**
 * ignore
 */
import {config, currentStatus, genEmbed} from '../../utils';
import * as Discord from 'discord.js';
import * as _ from 'lodash';
import * as Raven from 'raven';
import * as nanoid from 'nanoid';
import {resetCounters} from './reset';
import {genMatchModel, IMatch, IMatchDoc, IParticipants} from '../../db';
import * as Commando from 'discord.js-commando';
import {basename} from 'path';

export const collectors: Discord.ReactionCollector[] = [];
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
//TODO: Fix filter.
const filterApprove = (reaction, user) => reaction.emoji.name === '✅' && currentStatus.currentUsers.get(reaction.message.channel.id).findIndex(elem => elem.id === user.id) > -1;
const filterReroll = (reaction, user) => reaction.emoji.name === '🔄' && currentStatus.currentUsers.get(reaction.message.channel.id).findIndex(elem => elem.id === user.id) > -1;
export function teams(message: Commando.CommandoMessage, reroll?: boolean) {
	if (!message.channel) {
		return;
	}
	if (!config.allowedChannels.includes(message.channel.id)) {
		return;
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
		return message.replyEmbed({embed: currentStatus.teamMessage.get(message.channel.id)});
	}
	let teamsNumber: number;
	try {
		if (message.channel.type !== 'text') {
			return;
		}
		const channel = message.channel;
		teamsNumber = parseInt(channel.name.split('v')[0]);
	} catch (err) {
		console.log(err);
		Raven.captureException(err);
	}
	if (currentStatus.currentUsers.get(message.channel.id).length < teamsNumber * 2) {
		return message.reply('Get some more people!');
	}
	if (collectors.length > 0) {
		collectors.forEach(elem => elem.cleanup());
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
	const threshold = Math.floor((75 / 100) * (teamsNumber * 2));
	console.log('Threshold: ' + threshold);
	if (currentStatus.teams.get(message.channel.id).length === 2 && !reroll) {
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
	if (!teamsNumber) {
		teamsNumber = 2;
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
	message.channel.send({embed: currentStatus.teamMessage.get(message.channel.id)})
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
				console.log(`Reroll collector ended with reason: ${reason}`);
				currentStatus.rerollCount.set(msg.channel.id, currentStatus.rerollCount.get(msg.channel.id) + 1);
				collectors.forEach(elem => elem.cleanup());
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
				})
				.catch(err => {
					console.log(err);
					Raven.captureException(err);
				});

				currentStatus.locked.set(msg.channel.id, true);
				collectors.forEach(elem => elem.cleanup());
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

export class TeamsCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'teams',
			group: 'matches',
			memberName: 'teams',
			description: 'Get teams.',
			details: 'Get teams.',
			examples: ['teams']
		});
	}

	hasPermission(message) {
		if (!config.allowedChannels.includes(message.channel.id)) {
			return false;
		}
		return !!currentStatus.currentUsers.get(message.channel.id).find(elem => elem.id === message.author.id);

	}

	async run(message) {
		teams(message);
	}
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
