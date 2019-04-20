/**
 * @module Utils
 */
let confToUse = '../config.json';

export const config: IConfig = require(confToUse);

export interface IConfig {
	ravenDSN: string;
	token: string;
	mongoURL: string;
	ownerID: string[];
	pastebinKey: string;
	redditClientId: string;
	redditClientSecret: string;
	redditRefreshToken: string;
}
