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
import { reset } from './index';
export const collectors: Discord.ReactionCollector[] = [];
Raven.config(config.ravenDSN, {
	autoBreadcrumbs: true
}).install();
export function teams(message: any, reroll?: boolean) {
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
		teamsNumber = parseInt(message.channel.name.split('v')[0]);
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
	if (currentStatus.teams[message.channel.id].length === 2 && currentStatus.currentUsers[message.channel.id].length !== currentStatus.teams[message.channel.id][0].length + currentStatus.teams[message.channel.id][1].length) {
		reroll = true;
	}
	if (currentStatus.teams[message.channel.id].length === 2 && !reroll) {
		return message.channel.send({embed: currentStatus.teamMessage[message.channel.id]})
			.then((msg: Discord.Message) => {
				const reactionOne = '\u1F504';
				console.log((teamsNumber*2) - (teamsNumber / 2));
				msg.react('🔄')
				.then(() => {
					const reroll = new Discord.ReactionCollector(msg, reaction => currentStatus.teams[msg.channel.id].find(elem => elem.id !== reaction.message.author.id) && reaction._emoji.name === '🔄', {maxUsers: teamsNumber+2});
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
				});
				msg.react('✅')
				.then(() => {
					const reroll = new Discord.ReactionCollector(msg, reaction => currentStatus.teams[msg.channel.id].find(elem => elem.id !== reaction.message.author.id) && reaction._emoji.name === '✅', {maxUsers: teamsNumber+2});
					collectors.push(reroll);
					reroll.on('end', (reason) => {
						console.log(reason);
						console.log('Locking it in!');
						msg.channel.send(`Teams locked in.\n${currentStatus.currentUsers[msg.channel.id].join(' ')}`);
						currentStatus.locked[message.channel.id] = true;
						collectors.forEach(elem => elem.cleanup());
						setTimeout(() => {
							reset(message, true);
						}, 120000);
					});
				})
				.catch(err => {
					console.log(err);
				});
			})
	}
	if (!teamsNumber) teamsNumber = 2;

	currentStatus.teamsNumber[message.channel.id] = teamsNumber;
	console.log(currentStatus.teamsNumber[message.channel.id]);
	console.log(`currentStatus.teamsNumber: ${currentStatus.teamsNumber[message.channel.id]}`);
	console.log(`teamsNumber: ${currentStatus.teamsNumber[message.channel.id]}`);
	currentStatus.currentUsers[message.channel.id] = _.shuffle(currentStatus.currentUsers[message.channel.id]);
	currentStatus.teams[message.channel.id] = _.chunk(currentStatus.currentUsers[message.channel.id], teamsNumber);
	console.log(currentStatus.teams[message.channel.id]);
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
	message.channel.send({embed: currentStatus.teamMessage[message.channel.id]})
	.then((msg: Discord.Message) => {
		const reactionOne = '\u1F504';
		console.log((teamsNumber*2) - (teamsNumber / 2));
		message.channel.send(`React accordingly.\n${currentStatus.currentUsers[message.channel.id].join(' ')}`);
		msg.react('🔄')
		.then(() => {
			//TODO: Fix filter.
			const reroll = new Discord.ReactionCollector(msg, reaction => !currentStatus.teams[msg.channel.id].find(elem => elem.id === reaction.message.author.id) && reaction._emoji.name === '🔄', {maxUsers: teamsNumber+2});
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
		});
		msg.react('✅')
			.then(() => {
				const reroll = new Discord.ReactionCollector(msg, reaction => currentStatus.teams[msg.channel.id].find(elem => elem.id !== reaction.message.author.id) && reaction._emoji.name === '✅', {maxUsers: teamsNumber+2});
				collectors.push(reroll);
				reroll.on('end', (reason) => {
					console.log(reason);
					console.log('Locking it in!');
					msg.channel.send(`Teams locked in.\n${currentStatus.currentUsers[msg.channel.id].join(' ')}`);
					currentStatus.locked[message.channel.id] = true;
					collectors.forEach(elem => elem.cleanup());
					setTimeout(() => {
						reset(message, true);
					}, 120000);
				});
			})
			.catch(err => {
				console.log(err);
			});

	});

}
