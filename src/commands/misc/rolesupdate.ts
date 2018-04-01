/**
 * @module Commands
 */
/**
 * ignore
 */
import {config} from '../../utils';
import {client} from '../../index';
import * as Raven from 'raven';
import * as Commando from 'discord.js-commando';
import {Match} from '../../db';
import {basename} from 'path';
import {TextChannel} from "discord.js";
import * as _ from "lodash";

const tenID = '407634274217492480';
const twofiveID = '407634353795891203';
const fiftyID = '407634390248587284';
const hundredplusID = '407634430195138561';
const twohundredplusID = '426611540041531397';

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

export class RolesCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'roles',
			group: 'misc',
			memberName: 'roles',
			description: 'Tags people based on number of matches done.',
			details: 'Tags people based on number of matches done.',
			examples: ['roles'],
			arguments: [
				{
					key: 'dry',
					prompt: 'Run, but don\'t modify. Default true.',
					type: 'boolean',
					default: true
				}
			]
		});
	}

	hasPermission(msg) {
		if (!msg.guild) {
			return false;
		}
		if (!msg.guild.members) {
			return false;
		}
		return !!client.isOwner(msg.author);
	}

	async run(message, args) {
		const promises = [];
		const ids = [];
		const names = [];
		message.guild.members.forEach(elem => {
			const promise = Match.find({"participants.id": elem.id});
			promises.push(promise);
			ids.push(elem.id);
			names.push(elem.displayName);
		});
		const botLogChannel = client.channels.get(config.botLogID) as TextChannel;
		const logToBotSpam = msg => botLogChannel.send(msg);
		Promise.all(promises)
			.then(users => {
				users.forEach((elem, idx) => {
					if (elem && elem.length > 0) {
						console.log(`User: ${names[idx]} - ${elem.length} Matches`);
						let roleToGive = '';
						if (elem.length >= 10) {
							roleToGive = tenID;
						}
						if (elem.length >= 25) {
							roleToGive = twofiveID;
						}
						if (elem.length >= 50) {
							roleToGive = fiftyID;
						}
						if (elem.length >= 100) {
							roleToGive = hundredplusID;
						}
						if (elem.length >= 200) {
							roleToGive = twohundredplusID;
						}
						const member = message.guild.members.find('id', ids[idx]);
						if (member) {
							const role = message.guild.roles.get(roleToGive);
							if (role) {
								let botlogmsg = `${member.displayName} roles added:\n`;
								console.log(`Giving ${member.displayName} ${role.name} role`);
								botlogmsg += '```';
								botlogmsg += `${role.name}\n`;
								botlogmsg += '```';
								if (!args.dry && !member.roles.get(role)) {
									member.roles.add(role)
								}
								console.log(botlogmsg);
								logToBotSpam(botlogmsg);
							}
						}
					}
				});
			});
	}

}
