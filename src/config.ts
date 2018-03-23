/**
 * @module Utils
 */
/**
 * ignore
 */
const confToUse = process.env.SERVER_ENV === 'pvphub' ? '../config.pvphub.json' : '../config.arctic.json';

export const config: IConfig = require(confToUse);

export interface IConfig {
	allowedChannels: string[];
	queueChannelID: string;
	allowedServers: string[];
	allowedUsers: string[];
	allowedRoles: string[];
	flipRoles: string[];
	ravenDSN: string;
	token: string;
	mongoURL: string;
	ownerID: string[];
	pastebinKey: string;
	botLogID: string;
	redditClientId: string;
	redditClientSecret: string;
	redditRefreshToken: string;
}
