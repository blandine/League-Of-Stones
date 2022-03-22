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

async function getMatchData(req, res) {
  const response = await getMatchDataService(req.playerId,req.matchDocument);
  sendResponse(response, res, req);
}

async function getAllMatches(req, res) {
  const response = await getAllMatchesService(req.playerId);
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
  const response = await initDeckService(req.playerId, lDeck);
  sendResponse(response, res, req);

}

async function pickCard(req, res) {
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
    const pCard = req.query.card;
    const pEnemyCard = req.query.ennemyCard;
    const response = await attackCardService(req.playerId, pCard, pEnemyCard);
    sendResponse(response, res, req);
  } catch (e) {
    sendError(new StatusCodeError(e, 400), res);
  }
}

async function attackPlayer(req, res) {
  try {
    const pCard = req.query.card;
    const pMatchDocument = req.matchDocument;
    const pPlayer = req.player;

    const response = await attackPlayerService(pPlayer, pCard, pMatchDocument);
    sendResponse(response, res, req);
  } catch (e) {
    sendError(new StatusCodeError(e, 400), res);
  }
}

async function endTurn(req, res) {
  const pMatchDocument = req.matchDocument;
  const pPlayer = req.player;
  const response = await endTurnService(pPlayer,pMatchDocument);
  sendResponse(response, res, req);
}

async function finishMatch(req, res) {
  const response = await finishMatchService(req.playerId);
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
