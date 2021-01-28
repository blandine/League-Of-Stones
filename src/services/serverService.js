const { MongoDBConnection } = require("../utils/database")

async function deleteDb(){
    await MongoDBConnection.dropDatabase();
    return ["Server has been reinitialized",null];
}

module.exports = {deleteDb}