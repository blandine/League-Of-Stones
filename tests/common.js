const { MongoDBConnection } = require("../src/utils/database.js");


const user = {
    email: 'cat@cat.com',
    name: 'Cat',
    password: 'C4t',
};
const userbis = {
    email: 'cat2@cat.com',
    name: 'Cat2',
    password: 'C4t2',
};
const user1 = {
    email: 'foxy@cat.com',
    name: 'Foxy',
    password: 'f0xY',
};
const user2 = {
    email: 'nell@cat.com',
    name: 'Nell',
    password: 'n3lL',
};

const user3 = {
    email: 'foxy2@cat.com',
    name: 'Foxy',
    password: 'f0xY',
};
const user4 = {
    email: 'nell2@cat.com',
    name: 'Nell',
    password: 'n3lL',
};


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

module.exports = {
    mocks: {
        user,
        userbis,
        user1,
        user2,
        user3,
        user4
    },
    setupDb
};
