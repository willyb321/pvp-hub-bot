/**
 * @module Utils
 */
let confToUse;
if (process.env.SERVER_ENV === 'pvphub' && process.env.NODE_ENV === 'development') {
	confToUse = '../config.pvphub.test.json';
} else if (process.env.SERVER_ENV === 'pvphub') {
	confToUse = '../config.pvphub.json';
} else {
	confToUse = '../config.arctic.json';
}

export const config: IConfig = require(confToUse);

export interface IConfig {
	allowedChannels: string[];
	queueChannelID: string;
	allowedServers: string[];
	allowedUsers: string[];
	allowedRoles: string[];
	premadeChannelId: string;
	flipRoles: string[];
	ravenDSN: string;
	token: string;
	mongoURL: string;
	archiveCategoryId: string;
	eventCategoryId: string;
	ownerID: string[];
	pastebinKey: string;
	botLogID: string;
	redditClientId: string;
	tenID: string;
	twofiveID: string;
	fiftyID: string;
	hundredplusID: string;
	twohundredplusID: string;
	threehundredplusID: string;
	redditClientSecret: string;
	redditRefreshToken: string;
}
