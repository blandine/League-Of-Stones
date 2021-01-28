const { processServiceResponse, StatusCodeError } = require('../routes/utils');
var {
  getMatchDataService,
  getAllMatchesService,
  initDeckService,
  pickCardService,
  playCardService,
  attackCardService,
  attackPlayerService,
  endTurnService
} = require('../services/matchService');

async function getMatchData(req, res) {
  const lPlayingPlayerId = req.session.connectedUser.id;
  const [response, error] = await getMatchDataService(lPlayingPlayerId);
  processServiceResponse([response, error], res);
}

async function getAllMatches(req, res) {
  const [response, error] = await getAllMatchesService(lPlayingPlayerId);
  processServiceResponse([response, error], res);
}

async function initDeck(req, res) {
  try {
    const lDeck = JSON.parse(req.query.deck);
    if (!lDeck instanceof Array) {
      throw new Error('should be an array');
    }

    const lPlayingPlayerId = req.session.connectedUser.id;
    const [response, error] = await initDeckService(lPlayingPlayerId, lDeck);
    processServiceResponse([response, error], res);
  } catch (e) {
    processServiceResponse(
      [response, new StatusCodeError('Deck parsing error ' + e, 400)],
      res
    );
  }
}
async function pickCard(req, res) {
  try {
    const lPlayingPlayerId = req.session.connectedUser.id;
    const [response, error] = await pickCardService(lPlayingPlayerId);
    processServiceResponse([response, error], res);
  } catch (e) {
    processServiceResponse([response, e], res);
  }
}
async function playCard(req, res) {
  try {
    const lPlayingPlayerId = req.session.connectedUser.id;
    const pCard = req.query.card;
    if (!pCard) {
      throw new Error('Card query parameter is missing');
    }
    const [response, error] = await playCardService(lPlayingPlayerId, pCard);
    processServiceResponse([response, error], res);
  } catch (e) {
    processServiceResponse([response, e], res);
  }
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

    const [response, error] = await attackCardService(lPlayingPlayerId, pCard,pEnemyCard);
    processServiceResponse([response, error], res);
  } catch (e) {
    processServiceResponse([response, e], res);
  }
}

async function attackPlayer(req, res) {
  try {
    const lPlayingPlayerId = req.session.connectedUser.id;
    const pCard = req.query.card;
    if (!pCard) {
      throw new Error('card query parameter is missing');
    }

    const [response, error] = await attackPlayerService(lPlayingPlayerId, pCard);
    processServiceResponse([response, error], res);
  } catch (e) {
    processServiceResponse([response, e], res);
  }
}

async function endTurn(req, res) {
    const lPlayingPlayerId = req.session.connectedUser.id;
    const [response, error] = await endTurnService(lPlayingPlayerId, pCard);
    processServiceResponse([response, error], res);
}

async function finishMatch(req, res) {
  const lPlayingPlayerId = req.session.connectedUser.id;
  const [response, error] = await finishMatchService(lPlayingPlayerId);
  processServiceResponse([response, error], res);
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
