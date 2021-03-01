const { MongoDBConnection } = require("../src/utils/database.js");

function setupDb() {
    beforeAll(async (done) => {
        // Connect to a Mongo DB
        try {
            await MongoDBConnection.connect();
        } catch (error) {
            console.log("HEYYYYY")
        }
        done();
    })
    afterAll(async (done) => {
        await MongoDBConnection.close();
        done();
    })

}

module.exports = { setupDb, time: 10000 };