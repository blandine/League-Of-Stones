const MongoClient = require('mongodb').MongoClient;

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const MONGO_DB = process.env.MONGO_DB || 'League_Of_Stones';
class MongoDBConnection {
	static db;
	static connection;


	static connect() {
		return new Promise(async (resolve, reject) => {
			try {
				this.connection = await MongoClient.connect(MONGO_URL, {
					useNewUrlParser: true,
					useUnifiedTopology: true,
				});
				this.db = await this.connection.db(MONGO_DB)
				resolve(this.db)
			} catch (error) {
				reject(error)
			}
		});
	}
	static async close() {
		try {
			await this.connection.close();
		} catch (error) {
			console.log("mongo error", error)
		}
	}
	static getUsersCollection() {
		return this.db.collection(`Users`);
	}
	static getMatchmakingsCollection() {
		return this.db.collection(`Matchmaking`);
	}
	static getMatchCollection() {
		return this.db.collection(`Matchs`);
	}
	static getCardsCollection() {
		return this.db.collection(`Cards`);
	}
	static dropDatabase() {
		return this.db.dropDatabase();
	}
}

module.exports = { MongoDBConnection };