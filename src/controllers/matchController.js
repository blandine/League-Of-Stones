const { sendResponse, StatusCodeError, sendError } = require('../routes/utils');
const {
  getMatchDataService,
  getAllMatchesService,
  initDeckService,
  pickCardService,
  playCardService,
  attackCardService,
  attackPlayerService,
  endTurnService,
  finishMatchService
} = require('../services/matchService');

async function getMatchData(req, res) {
  const lPlayingPlayerId = req.session.connectedUser.id;
  const response = await getMatchDataService(lPlayingPlayerId);
  sendResponse(response, res);
}

async function getAllMatches(req, res) {
  const response = await getAllMatchesService(lPlayingPlayerId);
  sendResponse(response, res);
}

function extractDeck(pDeck) {
  try {
    const lDeck = JSON.parse(req.query.deck);
    if (!lDeck instanceof Array) {
      throw new Error('should be an array');
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
  }
  const lPlayingPlayerId = req.session.connectedUser.id;
  const response = await initDeckService(lPlayingPlayerId, lDeck);
  sendResponse(response, res);

}
async function pickCard(req, res) {
  const lPlayingPlayerId = req.session.connectedUser.id;
  const response = await pickCardService(lPlayingPlayerId);
  sendResponse(response, res);
}
async function playCard(req, res) {
  const lPlayingPlayerId = req.session.connectedUser.id;
  const pCard = req.query.card;
  if (!pCard) {
    sendError(new StatusCodeError('Card query parameter is missing', 400), res);
  }
  const response = await playCardService(lPlayingPlayerId, pCard);
  sendResponse(response, res);
}

async function attackCard(req, res) {
  try {
    const lPlayingPlayerId = req.session.connectedUser.id;
    const pCard = req.query.card;
    if (!pCard) {
      throw new Error('card query parameter is missing');
    }
    const pEnemyCard = req.query.ennemyCard;
    if (!pEnemyCard) {
      throw new Error('ennemyCard query parameter is missing');
    }

    const response = await attackCardService(lPlayingPlayerId, pCard, pEnemyCard);
    sendResponse(response, res);
  } catch (e) {
    sendError(new StatusCodeError(e, 400), res);
  }
}

async function attackPlayer(req, res) {
  try {
    const lPlayingPlayerId = req.session.connectedUser.id;
    const pCard = req.query.card;
    if (!pCard) {
      throw new Error('card query parameter is missing');
    }
    const response = await attackPlayerService(lPlayingPlayerId, pCard);
    sendResponse(response, res);
  } catch (e) {
    sendError(new StatusCodeError(e, 400), res);
  }
}

async function endTurn(req, res) {
  const lPlayingPlayerId = req.session.connectedUser.id;
  const response = await endTurnService(lPlayingPlayerId, pCard);
  sendResponse(response, res);
}

async function finishMatch(req, res) {
  const lPlayingPlayerId = req.session.connectedUser.id;
  const response = await finishMatchService(lPlayingPlayerId);
  sendResponse(response, res);
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
