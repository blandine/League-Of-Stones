const createError = require('http-errors');
const { MongoDBConnection } = require('./utils/database.js');
const { PLAYER1, PLAYER2 } = require('./utils/misc.js');

function requiresAuth(req, res, next) {
  if (req.session && req.session.connectedUser) {
    next();
  } else {
    next(createError(401, 'User not connected.'));
  }
}
function requiresMatchmakingId(req, res, next) {
  if (req.session && req?.session?.matchmakingId) {
    next();
  } else {
    next(
      createError(400, 'Matchmaking is undefined. Participate to have one!')
    );
  }
}

function hasCardQueryParam(req, res, next) {
  if (req.session && req?.query?.card) {
    next();
  } else {
    next(createError(400, 'card query parameter is missing'));
  }
}
function hasEnemyCardQueryParam(req, res, next) {
  if (req.session && req?.query?.ennemyCard) {
    next();
  } else {
    next(createError(400, 'ennemyCard query parameter is missing'));
  }
}

async function getCurrentMatch(pPlayingPlayerId) {
  const lCollection = await MongoDBConnection.getMatchCollection();
  return lCollection.findOne({
    $or: [
      { 'player1.id': pPlayingPlayerId },
      { 'player2.id': pPlayingPlayerId },
    ],
  });
}

async function hasMatchAssociated(req, res, next) {
  const lMatchDocument = await getCurrentMatch(req.playerId);
  if (lMatchDocument) {
    req.matchDocument = lMatchDocument
    next()
  } else {
    next(createError(404, 'There is no match associated'));
    return
  }
}
async function canPlay(req, res, next) {
  const lMatchDocument = await getCurrentMatch(req.playerId);
  if (lMatchDocument) {
    if (lMatchDocument[PLAYER1].board === undefined) {
      next(createError(400,'Match needs to be initialized first'));
      return
    }
    const lPlayer = req.playerId == lMatchDocument[PLAYER1].id ? PLAYER1 : PLAYER2;
    if (!lMatchDocument[lPlayer].turn) {
        next(createError(400,'Not your turn'));
        return
    }
    req.matchDocument = lMatchDocument
    req.player = lPlayer
    next();
  } else {
    next(createError(404, 'There is no match associated'));
  }
}
module.exports = {
  requiresAuth,
  requiresMatchmakingId,
  hasCardQueryParam,
  hasEnemyCardQueryParam,
  hasMatchAssociated,
  canPlay
};
