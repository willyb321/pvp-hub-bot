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
// import {CategoryChannel, TextChannel} from "discord.js";
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
// export class EventCommand extends Commando.Command {
// 	constructor(client) {
// 		super(client, {
// 			name: 'event',
// 			group: 'misc',
// 			memberName: 'event',
// 			description: 'Make an event.',
// 			details: 'Make an event.',
// 			examples: ['event'],
// 			guildOnly: true,
// 			args: [
// 				{
// 					key: 'teamSize',
// 					prompt: 'Team size?',
// 					type: 'integer',
// 					infinite: false
// 				},
// 				{
// 					key: 'organisers',
// 					prompt: 'Event organisers?',
// 					type: 'member',
// 					infinite: true
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
// 		const eventCategory = msg.guild.channels.get(config.eventCategoryId) as CategoryChannel;
// 		eventCategory.children.forEach(async elem => {
// 			const channel = elem as TextChannel;
// 			const archiveCategory = msg.guild.channels.get(config.archiveCategoryId) as TextChannel;
// 			const editData = {
// 				name: `event-archive-${channel.name}-${channel.createdAt.toDateString()}`,
// 				parentID: archiveCategory.id,
// 				lockPermissions: true
// 			};
// 			await channel.edit(editData);
// 			await channel.lockPermissions();
// 			return channel.send(`${channel.toString()} archived on ${new Date().toISOString()}`);
// 		});
// 		await msg.guild.channels.create('sign-up', {parent: eventCategory, reason: `Event requested by ${msg.author.tag}`});
// 		await msg.guild.channels.create('event-discussion', {parent: eventCategory, reason: `Event requested by ${msg.author.tag}`});
// 		await msg.guild.channels.create('looking-for-team', {parent: eventCategory, reason: `Event requested by ${msg.author.tag}`});
// 		eventCategory.children.forEach(async elem => {
// 			await elem.lockPermissions();
// 			const channel = elem as TextChannel;
// 			if (elem.name === 'sign-up') {
// 				const signUpMsg = `Example: \n\`\`\`<Team Name>: ${Array(args.teamSize).fill('@member').join(' ')}\`\`\``;
// 				await channel.send(signUpMsg);
// 			} else if (elem.name === 'event-discussion') {
// 				await channel.send(`Misc info:\n${args.teamSize} per team.\nEvent organisers: ${args.organisers.join(' ')}`);
// 			} else if (elem.name === 'looking-for-team') {
// 				await channel.send(`Look for a team here.`);
// 			}
// 		});
// 		return msg.reply('Event created');
// 	}
//
// }
