/**
 * @module Commands
 */
/**
 * ignore
 */
import {config, currentStatus, resetCounters} from '../../utils';
import * as Raven from 'raven';
import * as Commando from 'discord.js-commando';
import {basename} from 'path';
import * as _ from 'lodash';
import * as nanoid from 'nanoid';
import * as Discord from "discord.js";
import {genMatchModel, IMatch, IMatchDoc, IParticipants} from "../../db";
import {client} from "../../index";

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

export class PremadeCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'premade',
			group: 'matches',
			memberName: 'premade',
			description: 'Premake matches.',
			details: 'Premake matches.',
			examples: ['premade 2'],
			guildOnly: true,
			args: [
				{
					key: 'teamsNumber',
					prompt: 'How many per side? (2 for 2v2)',
					type: 'integer'
				}
			]
		});
	}

	hasPermission(message) {
		if (!message.channel || !message.channel.id) {
			return false;
		}
		return message.channel.id === config.premadeChannelId
	}

	async run(message, args) {
		const teamsNumber = args.teamsNumber;
		let text = `Premade for ${message.channel.toString()}:\n`;
		let t1 = `Team 1:\n`;
		let t2 = `Team 2:\n`;
		let teamsToUse = [[], []];
		const reaction_numbers = ["\u0030\u20E3", "\u0031\u20E3", "\u0032\u20E3", "\u0033\u20E3", "\u0034\u20E3", "\u0035\u20E3", "\u0036\u20E3", "\u0037\u20E3", "\u0038\u20E3", "\u0039\u20E3"];
		const oneOrTwo = val => val.toString() === reaction_numbers[1].toString() ? 0 : 1;
		let msg;
		try {
			msg = await message.channel.send(`${text}${t1}${t2}`);
			await msg.react(reaction_numbers[1]);
			await msg.react(reaction_numbers[2]);
			const filter = (reaction, user) => reaction.emoji.name === reaction_numbers[1] || reaction.emoji.name === reaction_numbers[2] && user.id !== message.client.user.id;
			const filterTwo = (reaction, user) => reaction.emoji.name === reaction_numbers[2] && user.id !== message.client.user.id;
			const filterOne = (reaction, user) => reaction.emoji.name === reaction_numbers[1] && user.id !== message.client.user.id;
			const addone = new Discord.ReactionCollector(msg, filter, {dispose: true});
			addone.on('remove', async (reaction, user) => {
				let what = 0;
				if (reaction.emoji.toString() === reaction_numbers[2]) {
					what = 1;
				}
				console.log(what);
				_.remove(teamsToUse[what], elem => elem.id === user.id);
				t1 = `Team 1 (${teamsToUse[0].length} / ${teamsNumber}):\n${teamsToUse[0].join('\n')}\n`;
				t2 = `Team 2 (${teamsToUse[1].length} / ${teamsNumber}):\n${teamsToUse[1].join('\n')}\n`;
				if (teamsToUse[0].length === teamsNumber) {
					addone.filter = filterTwo;
				}
				if (teamsToUse[1].length === teamsNumber) {
					addone.filter = filterOne;
				}
				if (teamsToUse[1].length === teamsNumber && teamsToUse[0].length === teamsNumber) {
					addone.stop();

				}
				await msg.edit(`${text}${t1}${t2}`);
			});
			addone.on('collect', async (reaction, user) => {
				let what = oneOrTwo(reaction.emoji.name);
				teamsToUse[what].push(user);
				teamsToUse[what] = _.uniqBy(teamsToUse[what], 'id');
				if (teamsToUse[what === 1 ? 0 : 1].find(elem => elem.id === user.id)) {
					_.remove(teamsToUse[what === 1 ? 0 : 1], elem => elem.id === user.id);
				}
				t1 = `Team 1 (${teamsToUse[0].length} / ${teamsNumber}):\n${teamsToUse[0].join('\n')}\n`;
				t2 = `Team 2 (${teamsToUse[1].length} / ${teamsNumber}):\n${teamsToUse[1].join('\n')}\n`;
				await msg.edit(`${text}${t1}${t2}`);
				console.log(teamsToUse[0].length + ' ' + teamsNumber);
				if (teamsToUse[0].length === teamsNumber) {
					addone.filter = filterTwo;
				}
				if (teamsToUse[1].length === teamsNumber) {
					addone.filter = filterOne;
				}
				if (teamsToUse[1].length === teamsNumber && teamsToUse[0].length === teamsNumber) {
					addone.stop();
				}

			});
			addone.on('end', async (reactions, reason) => {
				t1 = `Team 1:\n${teamsToUse[0].join('\n')}\n`;
				t2 = `Team 2:\n${teamsToUse[1].join('\n')}\n`;
				await message.channel.send(`${text}\n${t1}\n${t2}`);
				currentStatus.teams.set(message.channel.id, teamsToUse);
				console.log(`Approve collector ended with reason: ${reason}`);
				const curTime = Math.floor(new Date().getSeconds());
				const timeToTeam = Math.abs(curTime - curTime);
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
					startQueue: new Date().toISOString(),
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
						msg.channel.send(`Teams locked in. Match ID: ${savedDoc.matchNum}\n${teamsToUse[0].join(' ')} ${teamsToUse[1].join(' ')}`);
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
				if (currentStatus.collectors.has(message.channel.id)) {
					currentStatus.collectors.get(message.channel.id).forEach(elem => elem.stop('cleanup'));
					currentStatus.collectors.delete(message.channel.id);
				}
				const timeout = setTimeout(() => {
					resetCounters(msg);
				}, 3000);
				currentStatus.timeouts.set(msg.channel.id, timeout);
			});
		} catch (err) {
			console.error(err);
			Raven.captureException(err);
		} finally {
			return [];
		}
	}
}

