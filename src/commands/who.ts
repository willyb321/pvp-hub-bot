/**
 * @module Commands
 */
/**
 * ignore
 */
import {currentStatus, genEmbed} from '../utils';
import * as Discord from 'discord.js';

export function who(message: Discord.Message) {
	const usernames = [];
	const embed = genEmbed(`Current Queue`, `${message.channel.toString()}`)
	if (!currentStatus.currentUsers[message.channel.id]) {
		currentStatus.currentUsers[message.channel.id] = [];
	}
	currentStatus.currentUsers[message.channel.id].forEach((elem: Discord.User, index: number) => {
		embed.addField(index + 1, elem.toString());
	});
	if (currentStatus.currentUsers[message.channel.id].length === 0) {
		message.channel.send(`Nobody currently registered for ${message.channel.toString()}.`);
		return;
	}
	message.channel.send({embed});
}
