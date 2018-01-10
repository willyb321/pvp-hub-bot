import * as mongoose from 'mongoose';
import * as autoIncrement from 'mongoose-auto-increment';
import * as nanoid from 'nanoid';
import { config } from './utils';

mongoose.connect(config.mongoURL);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
	console.log('Mongo connected!');
});

autoIncrement.initialize(db);

const participantsSchema = new mongoose.Schema({
	id: String,
	team: Number
});

export interface Iparticipants {
	id: string;
	team: number;
}

const matchSchema = new mongoose.Schema({
    nanoid: {type: String, default: nanoid(12), required: true}, // 12char id eg Uakgb_J5m9g~0JDMbcJqLJ
    lobby: {type: String, required: true}, // channel name eg 2v2_home
    startQueue: {type: Date, required: true}, // ISODate string
    filledTime:  {type: Date, required: true}, // ISODate string
	result: {type: Number, required: true},  // team 1 = 1 team 2 = 2
	teamSelectionSec: {type: Number, required: true}, // Time (in sec) spent from initial teams to teams being locked in.
	participants: {type: [participantsSchema]},
	matchNum: {type: Number, index: true}
});



export interface IMatch {
	nanoid: string;
	lobby: number;
	startQueue: String;
	filledTime:  String;
	result: number;
	participants: Iparticipants[];
	teamSelectionSec: number;
}


export interface IMatchDoc extends mongoose.Document, IMatch {
	matchNum: number;
}



export interface IMatchModel extends mongoose.Model<IMatchDoc> {

}

export const Match: IMatchModel = mongoose.model('match', matchSchema);

matchSchema.plugin(autoIncrement.plugin, { model: 'match', field: 'matchNum', unique: true });

const wonLossSchema = new mongoose.Schema({
	id: String,
	team: Number,
	won: Boolean
});

export interface IWonLoss {
	id: string;
	team: number;
	won: boolean;
}

const userSchema = new mongoose.Schema({
    nanoid: {type: String, default: nanoid(12), required: true}, // 12char id eg Uakgb_J5m9g~0JDMbcJqLJ
	discordID: {type: String},
	won: {type: [wonLossSchema]},
	lost: {type: [wonLossSchema]}
});
export interface IUser {
	nanoid: string;
	discordID: string;
	won: IWonLoss[]
	lost: IWonLoss[];
}


export interface IUserDoc extends mongoose.Document, IUser {

}



export interface IUserModel extends mongoose.Model<IUserDoc> {

}

export const User: IUserModel = mongoose.model('match', matchSchema);


export const genMatchModel = (info: IMatch): IMatchDoc => new Match(info);
// export const genUserModel = (info: IUserDoc, won: boolean): IMatchDoc => Match.findOneAndUpdate({_id: info._id}, {$set: {  }})
