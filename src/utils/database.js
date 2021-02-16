const MongoClient = require('mongodb').MongoClient;

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const MONGO_DB = process.env.MONGO_DB || 'League_Of_Stones';
 class MongoDBConnection {
	static db;
	static client;


	static connect() {
		return new Promise((resolve, reject) => {
			MongoClient.connect(MONGO_URL, { useUnifiedTopology: true, useNewUrlParser: true }, (err, client) => {
				if (err) {
					reject(err);
				} else {
					this.db = client.db(MONGO_DB);
					resolve(this.db);
				}
			});
		});
	}
    static getUsersCollection() {
		return MongoDBConnection.db.collection(`Users`);
	}
    static getMatchmakingsCollection() {
		return MongoDBConnection.db.collection(`Matchmaking`);
	}
    static getMatchCollection() {
		return MongoDBConnection.db.collection(`Matchs`);
	}
    static getCardsCollection() {
		return MongoDBConnection.db.collection(`Cards`);
	}
	static dropDatabase() {
		return MongoDBConnection.db.dropDatabase();
	}
}

module.exports = {MongoDBConnection};