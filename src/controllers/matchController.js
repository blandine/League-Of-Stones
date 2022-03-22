const { sendResponse, StatusCodeError, sendError } = require('../routes/utils');

const {
  getMatchDataService,
  getAllMatchesService,
  initDeckService,
  pickCardService,
  attackCardService,
  attackPlayerService,
  endTurnService,
  finishMatchService,
  playCardService
} = require('../services/matchService');

function getSessionId(req){
  return req.session.connectedUser.id
}

async function getMatchData(req, res) {
  if (!req.session.connectedUser || !getSessionId(req)) {
    sendError(new StatusCodeError("Session is invalid", 400), res);
    return;
  }
  const lPlayingPlayerId = getSessionId(req);
  const response = await getMatchDataService(lPlayingPlayerId);
  sendResponse(response, res, req);
}

async function getAllMatches(req, res) {
  const response = await getAllMatchesService(lPlayingPlayerId);
  sendResponse(response, res, req);
}

function extractDeck(pDeck) {
  try {
    const lDeck = JSON.parse(pDeck);
    if (!lDeck instanceof Array) {
      throw 'should be an array'
    }
    return [lDeck, null]
  } catch (e) {
    return [null, new StatusCodeError('Deck parsing error ' + e, 400)]
  }
}

async function initDeck(req, res) {
  const [lDeck, error] = extractDeck(req.query.deck);
  if (error) {
    sendError(error, res);
    return;
  }
  const lPlayingPlayerId = getSessionId(req);
  const response = await initDeckService(lPlayingPlayerId, lDeck);
  sendResponse(response, res, req);

}

async function pickCard(req, res) {
  const lPlayingPlayerId = getSessionId(req);
  const lPlayer = req.player;
  const lMatchDocument = req.matchDocument;

  const response = await pickCardService(lPlayer,lMatchDocument);
  sendResponse(response, res, req);
}

async function playCard(req, res) {
  const pCardKey = req.query.card;
  const pMatchDocument = req.matchDocument;
  const pPlayer = req.player;
  const response = await playCardService(pMatchDocument, pPlayer, pCardKey);
  sendResponse(response, res, req);
}

async function attackCard(req, res) {
  try {
    const lPlayingPlayerId = getSessionId(req);
    const pCard = req.query.card;
    const pEnemyCard = req.query.ennemyCard;
    const lMatchDocument = req.matchDocument;
    const lPlayer = req.player;
    const response = await attackCardService(lPlayingPlayerId, pCard, pEnemyCard);
    sendResponse(response, res, req);
  } catch (e) {
    sendError(new StatusCodeError(e, 400), res);
  }
}

async function attackPlayer(req, res) {
  try {
    const lPlayingPlayerId = getSessionId(req);
    const pCard = req.query.card;
    const response = await attackPlayerService(lPlayingPlayerId, pCard);
    sendResponse(response, res, req);
  } catch (e) {
    sendError(new StatusCodeError(e, 400), res);
  }
}

async function endTurn(req, res) {
  const lPlayingPlayerId = getSessionId(req);
  const response = await endTurnService(lPlayingPlayerId);
  sendResponse(response, res, req);
}

async function finishMatch(req, res) {
  const lPlayingPlayerId = getSessionId(req);
  const response = await finishMatchService(lPlayingPlayerId);
  sendResponse(response, res, req);
}
module.exports = {
  getMatchData,
  getAllMatches,
  initDeck,
  pickCard,
  playCard,
  attackCard,
  attackPlayer,
  endTurn,
  finishMatch
};
