var bcrypt = require('bcrypt');
const { StatusCodeError } = require('../routes/utils.js');
const { MongoDBConnection } = require('../utils/database.js');

async function createAccount(pEmail, pPassword, pUsername) {
    const lSaltRounds = 10; // cost factor
    const lHashPass = bcrypt.hashSync(pPassword, lSaltRounds);
    try {
        const lCollection = await MongoDBConnection.getUsersCollection();

        const lUserResult = await lCollection.findOne({ email: pEmail });
        if (lUserResult) {
            return [null, new StatusCodeError('User already exists', 409)];
        }

        const lNewUser = await lCollection.insertOne({
            email: pEmail,
            name: pUsername,
            password: lHashPass,
        });
        return [{ id: lNewUser.insertedId }, null];
    } catch (error) {
        return [null, `Error during inserting a user : ${error}`];
    }
}

async function userExists(pEmail, pPassword){
    try {
        const lCollection = await MongoDBConnection.getUsersCollection();
        let lUserResult = await lCollection.findOne({ email: pEmail })
        if (!lUserResult) {
            return [null, 'Email or password incorrect'];
        }

        const lIsSameHash = await bcrypt.compare(pPassword, lUserResult.password)
        if (!lIsSameHash) {
            return [null, 'Email or password incorrect'];
        }
        return [lUserResult, null];
    }
    catch (e) {
        return [null, e]
    }
}

//TODO : add token into the mongo base, clear it when token is obsolete, test if already connect thanks to the mongobase
async function login(pEmail, pPassword, pToken) {
    try {
        const [lUserResult, lError] = await userExists(pEmail, pPassword);
        if (lError) {
            return [null, lError];
        }
        const lSessionInfo = {
            id: lUserResult._id.toString(),
            token: pToken,
            email: lUserResult.email,
            name: lUserResult.name
        }
        return [lSessionInfo, null];
    } catch (error) {
        return [null, error];
    }
}


async function logout(pUserId) {
    try {
        await clearUserPresence(pUserId);
        return ["Disconnected", null];
    } catch (error) {
        return [null, error];
    }
}

async function deleteAccount(pEmail, pPassword) {
    try {
        const [lUserResult, lError] = await userExists(pEmail, pPassword);
        if (lError) {
            return [null, lError];
        }
        const lCollection = await MongoDBConnection.getUsersCollection();
        const lUserIsRemoved = await lCollection.deleteOne({ _id:lUserResult._id})
        if (!lUserIsRemoved) {
            return [null, 'Error during user deletion'];
        }
        await clearUserPresence(lUserResult._id)
        return ["User account deleted (and disconnected)", null];
    } catch (error) {
        return [null, `Error during removing a user : ${error}`];
    }
}

async function clearUserPresence(pUserId){
    const lMatchmakingCollection = await MongoDBConnection.getMatchmakingsCollection();
    const lMatchCollection = await MongoDBConnection.getMatchCollection();
    await lMatchmakingCollection.deleteMany({ 'user.id': pUserId });
    await lMatchmakingCollection.deleteMany({ 'match.player1.id': pUserId });
    await lMatchmakingCollection.deleteMany({ 'match.player2.id': pUserId });
    await lMatchCollection.deleteMany({ 'player1.id': pUserId });
    await lMatchCollection.deleteMany({ 'player2.id': pUserId });
}

async function getAllUsers() {
    try {
        const lCollection = await MongoDBConnection.getUsersCollection();
        let result = await lCollection.find().toArray();
        var lListOfUsers = [];

        for (var user of result) {
            lListOfUsers.push({ email: user.email, name: user.name });
        }
        return [lListOfUsers, null];
    } catch (error) {
        return [null, error];
    }
}
module.exports = { getAllUsers, createAccount, deleteAccount, login, logout };
