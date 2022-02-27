const { StatusCodeError, sendResponse } = require('../routes/utils.js');
const { MongoDBConnection } = require('../utils/database.js');

const ObjectId = require('mongodb').ObjectID;

async function getMatchmakingById(pMatchmakingId) {
    const lCollection = await MongoDBConnection.getMatchmakingsCollection();
    return lCollection.findOne({ _id: new ObjectId(pMatchmakingId) });
}

async function removeMatchmakingIdFromRequests(pMatchmakingId) {
    const lCollection = await MongoDBConnection.getMatchmakingsCollection();
    return lCollection.updateMany({}, { $pull: { request: { matchmakingId: pMatchmakingId } } }, { multi: true });
}
async function removeMatchmakingById(pMatchmakingId) {
    const lCollection = await MongoDBConnection.getMatchmakingsCollection();
    return lCollection.deleteOne({ _id: new ObjectId(pMatchmakingId) });
}

async function addMatchmakingRequest(pMatchmakingId, pRequest) {
    const lCollection = await MongoDBConnection.getMatchmakingsCollection();
    return lCollection
        .updateOne(
            { _id: new ObjectId(pMatchmakingId) },
            { $addToSet: { request: { $each: [pRequest] } } }
        )
}
async function isMatchmakingIdRequestable(pMatchmakingId, pRequestedMatchmakingId) {
    const lCollection = await MongoDBConnection.getMatchmakingsCollection();

    return lCollection.findOne({
        _id: new ObjectId(pMatchmakingId),
        request: {
            $elemMatch: {
                matchmakingId:
                    pRequestedMatchmakingId
            }
        }
    });
}
async function getAvailableMatchmakings(pCurrentPlayerId) {
    const lCollection = await MongoDBConnection.getMatchmakingsCollection();
    const agg = [
        {
            '$match': {
                'match': {
                    '$exists': false
                },
                'user.id': {
                    '$ne': pCurrentPlayerId
                }
            }
        }, {
            '$project': {
                'matchmakingId': '$_id',
                'email': '$user.email',
                'name': '$user.name'
            }
        }
    ];
    return lCollection.aggregate(agg).toArray();
}
async function getUserMatchmaking(pEmail) {
    const lCollection = await MongoDBConnection.getMatchmakingsCollection();
    return lCollection.findOne({ 'user.email': pEmail });
}
async function createMatchmaking(pUser) {
    const lCollection = await MongoDBConnection.getMatchmakingsCollection();
    return lCollection.insertOne({
        user: pUser,
        request: []
    });
}

async function updateMatchmakingById(pMatchmakingId, pMatch) {
    const lCollection = await MongoDBConnection.getMatchmakingsCollection();
    if (pMatch !== undefined) {
        return lCollection.updateOne(
            { _id: new ObjectId(pMatchmakingId) },
            { $set: { request: [], match: pMatch } }
        );
    } else {
        return lCollection.updateOne(
            { _id: new ObjectId(pMatchmakingId) },
            { $set: { request: [] } },
            { $unset: { match: "" } }

        );
    }

}


async function participateService(pUser) {
    let lResult;
    const lMatchmakingDocument = await getUserMatchmaking(pUser.email);
    if (lMatchmakingDocument) {
        lResult = {
            matchmakingId: lMatchmakingDocument._id.toString(),
            request: lMatchmakingDocument.request,
            match: lMatchmakingDocument.match
        }
    } else {
        const lInsertedMatchmaking = await createMatchmaking(pUser)
        lResult = {
            matchmakingId: lInsertedMatchmaking.insertedId.toString(),
            request: []
        }
    }
    if (lResult.matchmakingId == undefined) {
        // TODO to test
        return [null, new StatusCodeError("Undefined matchmaking", 404)]
    }
    return [lResult, null];
}

async function unparticipateService(pMatchmakingId) {
    const lMatchmakingDocument = await getMatchmakingById(pMatchmakingId);
    if (!lMatchmakingDocument) {
        return [null, new StatusCodeError("MatchmakingId does not exist", 404)]
    }
    if (lMatchmakingDocument.match) {
        return [null, new StatusCodeError("Can't unparticipate when a match is on", 400)]
    }

    await removeMatchmakingIdFromRequests(pMatchmakingId);
    await removeMatchmakingById(pMatchmakingId);
    return ["Unparticipated", null];
}

async function getAllAvailableMatchmakingsService(pPlayerId) {
    const lMatchmakings = await getAvailableMatchmakings(pPlayerId);
    return [lMatchmakings, null];
}

async function sendRequestService(pRequestedMatchmakingId, pPlayerId, pPlayerName, pPlayerMatchmakingId) {
    const lMatchmakingDocument = await getMatchmakingById(pRequestedMatchmakingId);

    if (!lMatchmakingDocument) {
        return [null, new StatusCodeError("MatchmakingId does not exist", 404)]
    }
    const lRequest = {
        userId: pPlayerId,
        matchmakingId: pPlayerMatchmakingId,
        name: pPlayerName
    }
    const lRes = await addMatchmakingRequest(pRequestedMatchmakingId, lRequest)
    if (lRes.result.nModified) {
        return ["Request already sent", null];
    }
    return ["Request sent", null];
}

async function removeMatchByPlayerId(pPlayerId) {
    const lCollection = await MongoDBConnection.getMatchCollection();

    await lCollection.deleteMany({
        'player1.id': new ObjectId(pPlayerId)
    });
    await lCollection.deleteMany({
        'player2.id': new ObjectId(pPlayerId)
    });
}


async function createNewMatch(pMatchmakingId, pRequestedMatchmakingId, pPlayerId, pPlayerName, pRequestedPlayerId, pRequestedPlayerName) {

    //Remove existing match (the new one will replace the previous ones)
    await removeMatchByPlayerId(pPlayerId);
    await removeMatchByPlayerId(pRequestedPlayerId);
    const lMatch = {
        player1: {
            id: pRequestedPlayerId,
            name: pRequestedPlayerName
        },
        player2: {
            id: pPlayerId,
            name: pPlayerName
        }
    };
    const lCollection = await MongoDBConnection.getMatchCollection();
    let lResult = await lCollection.insertOne(lMatch);
    if (!lResult) {
        return [null, new StatusCodeError("Error on match creation", 400)];
    }

    await updateMatchmakingById(pMatchmakingId, lMatch);
    await updateMatchmakingById(pRequestedMatchmakingId, lMatch);
    return [lMatch, null];

}

async function quitMatch(pPlayerId, pRequestedPlayerId) {
    await removeMatchByPlayerId(pPlayerId);
    await removeMatchByPlayerId(pRequestedPlayerId);
    await updateMatchmakingById(pMatchmakingId);
    await updateMatchmakingById(pRequestedMatchmakingId, lMatch);
}

async function acceptRequestService(pMatchmakingId, pRequestedMatchmakingId, pPlayerId, pPlayerName) {
    const lMatchmakingRequester = await isMatchmakingIdRequestable(pMatchmakingId, pRequestedMatchmakingId);
    if (!lMatchmakingRequester) {
        return [null, new StatusCodeError("Requested matchmakingId does not exist", 404)]
    }
    const lRequestedMatchmakingId = await getMatchmakingById(pRequestedMatchmakingId);
    if (!lRequestedMatchmakingId) {
        return [null, new StatusCodeError("Requested match does not exist", 400)];
    }
    if (lRequestedMatchmakingId?.match) {
        return [null, new StatusCodeError("Already in match (too late)", 409)];
    }

    return createNewMatch(pMatchmakingId, pRequestedMatchmakingId, pPlayerId, pPlayerName, lRequestedMatchmakingId?.user?.id, lRequestedMatchmakingId?.user?.name)
}

module.exports = {
    participateService,
    unparticipateService,
    getAllAvailableMatchmakingsService,
    sendRequestService,
    acceptRequestService
};
