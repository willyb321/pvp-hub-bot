/**
 * @module Index
 */
/**
 * ignore
 */
// Import modules
import 'source-map-support/register';
import * as Commando from 'discord.js-commando';
import * as Raven from 'raven';
import * as consola from 'consola';
import {config, currentStatus, figureOutTeams, writeLog} from './utils';
import {basename, join} from 'path';
import * as sqlite from 'sqlite';
import {oneLine} from 'common-tags';
import {TextChannel} from 'discord.js';
import {updateQueues} from './queuesUpdate';

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
process.on('uncaughtException', err => {
	console.error(err);
	Raven.captureException(err);
});

process.on('unhandledRejection', (err: Error) => {
	console.error(err);
	Raven.captureException(err);
});

// Create an instance of a Discord client
export const client = new Commando.CommandoClient({
	owner: config.ownerID,
	commandPrefix: '?',
	unknownCommandResponse: false
});

client
	.on('error', console.error)
	.on('debug', process.env.NODE_ENV === 'development' ? console.info : () => {})
	.on('warn', console.warn)
	.on('disconnect', () => console.warn('Disconnected!'))
	.on('reconnecting', () => console.warn('Reconnecting...'))
	.on('commandError', (cmd, err) => {
		if (err instanceof Commando.FriendlyError) { return; }
		console.error(`Error in command ${cmd.groupID}:${cmd.memberName}`, err);
	})
	.on('commandBlocked', (msg, reason) => {
		consola.info(oneLine`
			Command ${msg.command ? `${msg.command.groupID}:${msg.command.memberName}` : ''}
			blocked; ${reason}
		`);
	})
	.on('commandPrefixChange', (guild, prefix) => {
		consola.info(oneLine`
			Prefix ${prefix === '' ? 'removed' : `changed to ${prefix || 'the default'}`}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	})
	.on('commandStatusChange', (guild, command, enabled) => {
		consola.info(oneLine`
			Command ${command.groupID}:${command.memberName}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	})
	.on('groupStatusChange', (guild, group, enabled) => {
		consola.info(oneLine`
			Group ${group.id}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	});

client.setProvider(
	sqlite.open(join(__dirname, '..', 'settings.sqlite3')).then(db => new Commando.SQLiteProvider(db))
).catch(err => {
	console.error(err);
	Raven.captureException(err);
});

// The ready event is vital, it means that your bot will only start reacting to information
// from Discord _after_ ready is emitted
client.on('ready', async () => {
	consola.info(`Client ready; logged in as ${client.user.username}#${client.user.discriminator} (${client.user.id})`);
	try {
		await client.user.setActivity('the pew pews');
	} catch (err) {
		console.error(err);
		Raven.captureException(err);
	}
	setTimeout(setUpLobbies, 1000);
});

client.on('guildMemberAdd',member => {
	const channel = member.guild.channels.get(config.botLogID) as TextChannel;
	if (!channel) {
		return;
	}
	channel.send(`<@${member.id}> joined the server`);
});

client.on('guildMemberRemove',member => {
	const channel = member.guild.channels.get(config.botLogID) as TextChannel;
	if (!channel) {
		return;
	}
	channel.send(`${member.displayName} left the server`);
});

async function setUpLobbies() {
	const guild = client.guilds.get(config.allowedServers[0]);
	if (!guild || !guild.available) {
		return;
	}
	const channels = guild.channels;
	if (channels) {
		channels.forEach(async chan => {
			const channel = chan as TextChannel;
			if (channel.type !== 'text') {
				return;
			}
			let msg;
			if (!isNaN(figureOutTeams(channel))) {
				currentStatus.currentUsers.set(channel.id, []);
			}
			try {
				if (channel && channel.lastMessageID) {
					msg = await channel.messages.fetch(channel.lastMessageID);
				}
			} catch (err) {
				if (err.code !== 50001 && err.code !== 10008) {
					console.error(err);
					Raven.captureException(err);
				}
			}
			if (!msg || !channel) {
				return;
			}

		});
		updateQueues()
			.then(() => {

			})
			.catch(err => {
				console.error(err);
				Raven.captureException(err);
			});
	}
}

client.on('message', message => {
	if (message.channel.type !== 'text') {
		return;
	}
	const channel = message.channel as TextChannel;
	writeLog(`<${message.author.username}> ${message.content}/${message.id}`, 'Channel - ' + message.guild.name + '/' + channel.name);
});

client.registry
	.registerGroup('matches', 'Matches')
	.registerGroup('misc', 'Misc')
	.registerDefaults()
	.registerCommandsIn(join(__dirname, 'commands', 'matches'))
	.registerCommandsIn(join(__dirname, 'commands', 'misc'));

// Log our bot in
client.login(config.token)
	.then(() => {
		consola.info('PvP Hub bot logged in.');
	})
	.catch((err: Error) => {
		Raven.captureException(err);
		process.exit(1);
	});
