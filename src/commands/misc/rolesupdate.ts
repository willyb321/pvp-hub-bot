// /**
//  * @module Commands
//  */
// /**
//  * ignore
//  */
// import {config} from '../../utils';
// import {client} from '../../index';
// import * as Raven from 'raven';
// import * as Commando from 'discord.js-commando';
// import consola from 'consola';
// import {Match} from '../../db';
// import {basename} from 'path';
// import {TextChannel} from 'discord.js';
//
// const {tenID, twofiveID, fiftyID, hundredplusID, twohundredplusID, threehundredplusID} = config;
// const rolesInOrder = [tenID, twofiveID, fiftyID, hundredplusID, twohundredplusID, threehundredplusID];
//
// Raven.config(config.ravenDSN, {
// 	autoBreadcrumbs: true,
// 	dataCallback(data) { // source maps
// 		const stacktrace = data.exception && data.exception[0].stacktrace;
//
// 		if (stacktrace && stacktrace.frames) {
// 			stacktrace.frames.forEach(frame => {
// 				if (frame.filename.startsWith('/')) {
// 					frame.filename = 'app:///' + basename(frame.filename);
// 				}
// 			});
// 		}
//
// 		return data;
// 	}
// }).install();
//
// export class RolesCommand extends Commando.Command {
// 	constructor(client) {
// 		super(client, {
// 			name: 'roles',
// 			group: 'misc',
// 			memberName: 'roles',
// 			description: 'Tags people based on number of matches done.',
// 			details: 'Tags people based on number of matches done.',
// 			examples: ['roles']
// 		});
// 	}
//
// 	hasPermission(msg) {
// 		if (!msg.guild) {
// 			return false;
// 		}
// 		if (!msg.guild.members) {
// 			return false;
// 		}
// 		return client.isOwner(msg.author);
// 	}
//
// 	async run(message) {
// 		const promises = [];
// 		const ids = [];
// 		const names = [];
// 		message.guild.members.forEach(elem => {
// 			const promise = Match.find({'participants.id': elem.id});
// 			promises.push(promise);
// 			ids.push(elem.id);
// 			names.push(elem.displayName);
// 		});
// 		const botLogChannel = client.channels.get(config.botLogID) as TextChannel;
// 		const logToBotSpam = msg => botLogChannel.send(msg);
// 		Promise.all(promises)
// 			.then(users => {
// 				users.forEach((elem, idx) => {
// 					if (idx % 50 === 0 || idx === users.length - 1) {
// 						const rolesUpdateMsg = `Processed ${idx} / ${users.length - 1}`;
// 						logToBotSpam(rolesUpdateMsg);
// 					}
// 					if (elem && elem.length > 0) {
// 						consola.info(`User: ${names[idx]} - ${elem.length} Matches`);
// 						let roleToGive = '';
// 						if (elem.length >= 10) {
// 							roleToGive = tenID;
// 						}
// 						if (elem.length >= 25) {
// 							roleToGive = twofiveID;
// 						}
// 						if (elem.length >= 50) {
// 							roleToGive = fiftyID;
// 						}
// 						if (elem.length >= 100) {
// 							roleToGive = hundredplusID;
// 						}
// 						if (elem.length >= 200) {
// 							roleToGive = twohundredplusID;
// 						}
// 						if (elem.length >= 300) {
// 							roleToGive = threehundredplusID;
// 						}
// 						const member = message.guild.members.get(ids[idx]);
// 						if (member) {
// 							const role = message.guild.roles.get(roleToGive);
// 							if (role) {
// 								let rolesUpdateMsg = `Roles updated for \`${member.displayName}\`:\n`;
// 								consola.info(`Giving ${member.displayName} ${role.name} role`);
// 								let newRoles;
// 								let removedRoles = [];
// 								member.roles.clone().array().forEach(oldRole => {
// 									if (rolesInOrder.indexOf(oldRole.id) !== -1 && oldRole.id !== role.id && rolesInOrder.indexOf(oldRole.id) !== rolesInOrder.indexOf(role.id)) {
// 										consola.info(oldRole.name);
// 										newRoles = newRoles ? newRoles.clone() : member.roles.clone();
// 										newRoles.delete(oldRole.id);
// 										removedRoles.push(oldRole.name);
// 										rolesUpdateMsg += `Removed ${oldRole.name} from \`${member.displayName}\`\n`;
// 									}
// 								});
// 								if (newRoles && newRoles.array().length !== member.roles.array().length) {
// 									member.roles.set(newRoles, `Already had another role. (Removed: ${removedRoles.join(', ')})`)
// 										.then(() => {
// 											consola.info(`Removed ${removedRoles.join(', ')} from \`${member.displayName}\``);
// 										})
// 										.catch(err => {
// 											console.error(err);
// 											Raven.captureException(err);
// 										});
// 								}
//
// 								if (member.roles.get(role.id)) {
// 									if (rolesUpdateMsg === `Roles updated for \`${member.displayName}\`:\n`) {
// 										return;
// 									}
// 									logToBotSpam(rolesUpdateMsg);
// 									rolesUpdateMsg = '';
// 									return;
// 								}
// 								member.roles.add(role)
// 									.then(() => {
// 										rolesUpdateMsg += `Giving ${member.displayName} ${role.name} role\n`;
// 										logToBotSpam(rolesUpdateMsg);
// 									})
// 									.catch(err => {
// 										Raven.captureException(err);
// 										console.error(err);
// 									});
// 							}
// 						}
// 					}
// 				});
// 			});
// 		return message.channel.send('Updating roles. Please stand by.');
// 	}
//
// }
