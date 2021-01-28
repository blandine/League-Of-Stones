const { StatusCodeError, sendResponse } = require('../routes/utils.js');
const { MongoDBConnection } = require('../utils/database.js');

const ObjectId = require('mongodb').ObjectID;

async function getMatchmakingById(pMatchmakingId) {
    const lCollection = await MongoDBConnection.getMatchmakingsCollection();
    return lCollection.findOne({ _id: new ObjectId(pMatchmakingId) });
}

async function removeMatchmakingIdFromRequests(pMatchmakingId) {
    const lCollection = await MongoDBConnection.getMatchmakingsCollection();
    return lCollection.update({}, { $pull: { request: { matchmakingId: pMatchmakingId } } }, { multi: true });
}

async function addMatchmakingRequest(pMatchmakingId, pRequest) {
    const lCollection = await MongoDBConnection.getMatchmakingsCollection();
    return lCollection
        .update(
            { _id: new ObjectId(pMatchmakingId) },
            { $push: { request: pRequest } }
        )
}
async function isMatchmakingIdRequestable(pMatchmakingId, pRequestedMatchmakingId) {
    const lCollection = await MongoDBConnection.getMatchmakingsCollection();

    return lCollection.findOne({
        _id: new ObjectId(pMatchmakingId),
        request: { $elemMatch: { matchmakingId: pRequestedMatchmakingId } }
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
                'user._id': {
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
    return ["Unparticipated", null];
}

async function getAllAvailableMatchmakingsService(pPlayerId) {
    const lMatchmakings = await getAvailableMatchmakings(pPlayerId);
    return [lMatchmakings, null];
}

async function sendRequestService(pMatchmakingId, pPlayerId, pPlayerName) {
    const lMatchmakingDocument = await getMatchmakingById(pMatchmakingId);

    if (!lMatchmakingDocument) {
        return [null, new StatusCodeError("MatchmakingId does not exist", 404)]
    }
    const lRequest = {
        userId: pPlayerId,
        matchmakingId: pMatchmakingId,
        name: pPlayerName
    }
    await addMatchmakingRequest(pMatchmakingId, lRequest)

    return ["Request sent", null];
}

async function removeMatchByPlayerId(pPlayerId) {
    const lCollection = await MongoDBConnection.getMatchCollection();

    lCollection.remove({
        'player1.id': new ObjectId(pPlayerId)
    });
    lCollection.remove({
        'player2.id': new ObjectId(pPlayerId)
    });
}

async function updateMatchmakingById(pMatchmakingId, pMatch) {
    const lCollection = await MongoDBConnection.getMatchmakingsCollection();

    lCollection.update(
        { _id: new ObjectId(pMatchmakingId) },
        { $set: { request: [], match: pMatch } }
    );
}
async function createNewMatch(pMatchmakingId, pRequestedMatchmakingId, pPlayerId, pPlayerName, pRequestedPlayerId, pRequestedPlayerName) {

    //Remove existing match (the new one will replace the previous ones)
    await removeMatchByPlayerId(pPlayerId);
    await removeMatchByPlayerId(pRequestedPlayerId);
    const lMatch = {
        player1: {
          name: pRequestedPlayerId,
          id: pRequestedPlayerName
        },
        player2: {
          name: pPlayerId,
          id: pPlayerName
        }
      };
    const lCollection = await MongoDBConnection.getMatchCollection();
    let lResult= await lCollection.insertOne(lMatch);
    if(!lResult){
        return [null, new StatusCodeError("Error on match creation", 400)];
    }

    await updateMatchmakingById(pMatchmakingId, lMatch);
    await updateMatchmakingById(pRequestedMatchmakingId, lMatch);
    return [lMatch,null];
    
}

async function acceptRequestService(pMatchmakingId, pRequestedMatchmakingId, pPlayerId) {
    const lMatchmakingRequester = await isMatchmakingIdRequestable(pMatchmakingId, pRequestedMatchmakingId);
    if (!lMatchmakingRequester) {
        return [null, new StatusCodeError("Requested matchmakingId does not exist", 404)]
    }
    const lRequestedMatchmakingId = getMatchmakingById(pRequestedMatchmakingId);
    if (!lRequestedMatchmakingId.match) {
        return [null, new StatusCodeError("Already in match (too late)", 400)];
    }
    
    return createNewMatch(pMatchmakingId, pRequestedMatchmakingId, pPlayerId,pPlayerName,lRequestedMatchmakingId.user._id,lRequestedMatchmakingId.user.name)

}
module.exports = {
    participateService,
    unparticipateService,
    getAllAvailableMatchmakingsService,
    sendRequestService,
    acceptRequestService
};
