/**
 * @module Commands
 */
/**
 * ignore
 */
import {config, currentStatus, genEmbed} from '../utils';
import * as Discord from 'discord.js';
import * as _ from 'lodash';
import * as Raven from "raven";
import { client } from '../index';
import { setTimeout } from 'timers';
import * as nanoid from 'nanoid';
import { reset } from './index';
import * as aysync from "async";
import { genMatchModel, IMatch, Iparticipants, Match } from '../db';
export const collectors: Discord.ReactionCollector[] = [];
Raven.config(config.ravenDSN, {
	autoBreadcrumbs: true
}).install();

//TODO: Fix filter.
const filter = (reaction, msg, emoji) => currentStatus.teams[msg.channel.id].find(elem => elem.id !== reaction.message.author.id) !== undefined && reaction._emoji.name === emoji;

export function teams(message: Discord.Message, reroll?: boolean) {
	if (!currentStatus.currentUsers[message.channel.id]) {
		currentStatus.currentUsers[message.channel.id] = [];
	}

	if (!currentStatus.locked[message.channel.id]) {
		currentStatus.locked[message.channel.id] = false;
	}
	if (currentStatus.locked[message.channel.id] === true) {
		return message.reply({embed: currentStatus.teamMessage[message.channel.id]})
	}
	let teamsNumber: number;
	try {
		if (message.channel.type !== 'text') {
			return;
		}
		const channel: any = message.channel;
		teamsNumber = parseInt(channel.name.split('v')[0]);
	} catch (err) {
		Raven.captureException(err);
	}
	if (currentStatus.currentUsers[message.channel.id].length < teamsNumber*2) {
		return message.reply('Get some more people!');
	}
	if (collectors.length > 0) {
		collectors.forEach(elem => elem.cleanup());
		collectors.slice(0, collectors.length)
	}
	const curTeamLength =
	(currentStatus.teams[message.channel.id] && currentStatus.teams[message.channel.id][0] && currentStatus.teams[message.channel.id][1]) ?
		currentStatus.teams[message.channel.id][0].length + currentStatus.teams[message.channel.id][1].length
		: 0
	if (currentStatus.teams[message.channel.id].length === 2 && currentStatus.currentUsers[message.channel.id].length !== curTeamLength) {
		reroll = true;
	}
	const threshold = Math.floor((75 / 100) * (teamsNumber * 2));
	console.log('Threshold: ' + threshold);
	if (currentStatus.teams[message.channel.id].length === 2 && !reroll) {
		return message.channel.send({embed: currentStatus.teamMessage[message.channel.id]})
			.then((msg: Discord.Message) => {
				const reactionOne = '\u1F504';
				teamsReactionApprove(msg, threshold)
				.then(() => teamsReactionReroll(msg, threshold));
			});
	}
	if (!teamsNumber) teamsNumber = 2;

	currentStatus.teamsNumber[message.channel.id] = teamsNumber;
	console.log(`currentStatus.teamsNumber: ${currentStatus.teamsNumber[message.channel.id]}`);
	console.log(`teamsNumber: ${currentStatus.teamsNumber[message.channel.id]}`);
	currentStatus.currentUsers[message.channel.id] = _.shuffle(currentStatus.currentUsers[message.channel.id]);
	currentStatus.teams[message.channel.id] = _.chunk(currentStatus.currentUsers[message.channel.id], teamsNumber);
	const embed = genEmbed(`Teams: `, `2 teams`);
	let teamMessage = `${currentStatus.teamsNumber[message.channel.id]} Teams:\n\n`;
	currentStatus.teams[message.channel.id].forEach((elem, index) => {
		let inTeam = [];
		teamMessage += `Team ${index + 1}:\n`;
		elem.forEach((user: Discord.User) => {
			inTeam.push(user.toString());
		});
		embed.addField(`Team ${index + 1}`, inTeam.join('\n'));
	});
	currentStatus.teamMessage[message.channel.id] = embed;
	if (!currentStatus.queueTeamTimes[message.channel.id]) {
		currentStatus.queueTeamTimes[message.channel.id] = new Date();
	}
	console.log(currentStatus.queueTeamTimes[message.channel.id]);
	message.channel.send({embed: currentStatus.teamMessage[message.channel.id]})
		.then((msg: Discord.Message) => {
			const reactionOne = '\u1F504';
			teamsReactionApprove(msg, threshold)
			.then(() => teamsReactionReroll(msg, threshold));
		});

}

function teamsReactionReroll(msg: Discord.Message, threshold: number) {
	return msg.react('🔄')
		.then(() => {
			const reroll = new Discord.ReactionCollector(msg, (reaction => filter(reaction, msg, '🔄')), {maxUsers: threshold+1});
			collectors.push(reroll);
			reroll.on('end', (reason) => {
				console.log(reason);
				console.log('Rerolling!');
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

			const reroll = new Discord.ReactionCollector(msg, (reaction => {console.log(currentStatus.teams[msg.channel.id].find(elem => elem.id !== reaction.message.author.id)); return filter(reaction, msg, '✅')}), {maxUsers: threshold+1});
			collectors.push(reroll);
			reroll.on('end', (reason) => {
				console.log(reason);
				console.log('Locking it in!');
				const curTime: any = new Date();
				const timeToTeam = Math.abs(new Date().getTime() - currentStatus.queueTeamTimes[msg.channel.id]) / 1000;
				const participants: Iparticipants[] = [];
				const channel: any = msg.channel;
				let lobby;
				try {
					lobby = channel.name;
				} catch (err) {
					console.log(err);
					Raven.captureException(err);
				}
				currentStatus.teams[msg.channel.id].forEach((elem, ind) => {
					elem.forEach(user => {
						participants.push({id: user.id, team: ind+1});
					});
				});
				const matchInfo: IMatch = {
					nanoid: nanoid(12),
					lobby: lobby || 'unknown',
					startQueue: currentStatus.queueStartTimes[msg.channel.id].toISOString(),
					filledTime: new Date().toISOString(),
					result: 12,
					teamSelectionSec: timeToTeam,
					participants: participants
				};


				const doc = genMatchModel(matchInfo);
				doc.save()
				.then((savedDoc) => {
					msg.channel.send(`Teams locked in. Match ID: ${savedDoc.matchNum}\n${currentStatus.currentUsers[msg.channel.id].join(' ')}`);
					msg.channel.send({embed: currentStatus.teamMessage[msg.channel.id]});
					currentStatus.queueTeamTimes[msg.channel.id] = null;
				})
				.catch(err => {
					console.log(err);
					Raven.captureException(err);
				});

				currentStatus.locked[msg.channel.id] = true;
				collectors.forEach(elem => elem.cleanup());
				currentStatus.timeouts[msg.channel.id] = setTimeout(() => {
					reset(msg, true);
				}, 120000);
			});
		})
		.catch(err => {
			console.log(err);
			Raven.captureException(err);
		});
}
