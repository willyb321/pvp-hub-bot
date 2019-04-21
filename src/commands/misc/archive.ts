// /**
//  * @module Commands
//  */
// /**
//  * ignore
//  */
// import {config, genEmbed} from '../../utils';
// import * as Commando from 'discord.js-commando';
// import {basename} from 'path';
// import * as Raven from 'raven';
// import {cp} from "shelljs";
// import {TextChannel} from "discord.js";
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
// export class ArchiveCommand extends Commando.Command {
// 	constructor(client) {
// 		super(client, {
// 			name: 'archive',
// 			group: 'misc',
// 			memberName: 'archive',
// 			description: 'Archive a channel.',
// 			details: 'Archive a channel.',
// 			examples: ['archive #bot-spam'],
// 			guildOnly: true,
// 			args: [
// 				{
// 					key: 'channel',
// 					prompt: 'Channel to archive?',
// 					type: 'channel',
// 					infinite: true,
// 					error: 'Channel is already archived',
// 					validate: (val, msg) => {
// 						const id = val.replace(/(^<#)|(>$)/igm, '');
// 						const channel = msg.guild.channels.get(id) as TextChannel;
// 						return !channel.name.startsWith('archive-');
// 					}
// 				}
// 			]
// 		});
// 	}
//
// 	hasPermission(msg) {
// 		return msg.client.isOwner(msg.author);
// 	}
//
// 	async run(msg, args) {
// 		for (const channel of args.channel) {
// 			const archiveCategory = msg.guild.channels.get(config.archiveCategoryId) as TextChannel;
// 			const editData = {
// 				name: `archive-${channel.name}`,
// 				parentID: archiveCategory.id,
// 				lockPermissions: true
// 			};
// 			await channel.edit(editData, `Archive requested by ${msg.author.tag}`);
// 			await channel.lockPermissions([], `Archive requested by ${msg.author.tag}`);
// 			await channel.send(`${channel.toString()} archived on ${new Date().toISOString()} by ${msg.author.tag} (${msg.author.toString()})`);
// 		}
// 		return msg.channel.send(`${args.channel.join(', ')} archived`);
// 	}
//
// }
