const { StatusCodeError } = require('../routes/utils.js')
const { MongoDBConnection } = require('../utils/database.js')

const ObjectId = require('mongodb').ObjectID;
const { all_different,WHO,PLAYER1,PLAYER2,MATCH_STATUS } = require('../utils/misc.js')

async function getCurrentMatch(pPlayingPlayerId) {
  const lCollection = await MongoDBConnection.getMatchCollection();
  return lCollection.findOne({
    $or: [
      { 'player1.id': pPlayingPlayerId },
      { 'player2.id': pPlayingPlayerId },
    ],
  });
}

async function removeMatch(pMatchId) {
  const lCollection = await MongoDBConnection.getMatchCollection();
  return lCollection.deleteOne({ _id: new ObjectId(pMatchId) });
}
async function removeMatchmaking(pMatchId) {
  const lCollection = await MongoDBConnection.getMatchmakingsCollection();
  return lCollection.deleteMany({ 'match._id': new ObjectId(pMatchId) });
}
function getConnectedPlayer(pPlayingPlayerId, pMatch) {
  return pPlayingPlayerId == pMatch[PLAYER1].id ? PLAYER1 : PLAYER2;
}
function hasDeck(pMatchPlayer) {
  return pMatchPlayer.deck?.length > 0;
}
function getDeckLength(pMatchPlayer) {
  return pMatchPlayer.deck?.length ?? 0;
}
function getHandLength(pMatchPlayer) {
  return pMatchPlayer.hand?.length ?? 0;
}
function matchNeedsInit(pMatchDocument) {
  return (
    pMatchDocument[PLAYER1].board === undefined &&
    hasDeck(pMatchDocument[PLAYER1]) &&
    hasDeck(pMatchDocument[PLAYER2])
  );
}

function getMatchInit(pMatch) {
  const deckPlayer1 = pMatch[PLAYER1].deck.splice(0, 4);
  const deckPlayer2 = pMatch[PLAYER2].deck.splice(0, 4);
  return {
    ...pMatch,
    status: MATCH_STATUS[PLAYER1],
    player1: {
      ...pMatch[PLAYER1],
      hp: 150,
      hand: deckPlayer1,
      board: [],
      turn: true,
      cardPicked: false,
    },
    player2: {
      ...pMatch[PLAYER2],
      hp: 150,
      hand: deckPlayer2,
      board: [],
      turn: false,
      cardPicked: false,
    },
  };
}

function getMatchResponse(pPlayingPlayerId, pMatch) {
  const me = getConnectedPlayer(pPlayingPlayerId, pMatch);
  const enemy = WHO[me].enemy;
  return {
    ...pMatch,
    [enemy]: {
      ...pMatch[enemy],
      hand: getHandLength(pMatch[enemy]),
      deck: getDeckLength(pMatch[enemy]),
    },
    [me]: {
      ...pMatch[me],
      deck: getDeckLength(pMatch[me]),
    },
  };
}

async function updateMatch(pMatchId, pNewMatch) {
  const lCollection = await MongoDBConnection.getMatchCollection();
  delete pNewMatch._id;
  return lCollection.replaceOne({ _id: new ObjectId(pMatchId) }, pNewMatch);
}

async function updatePlayerDeck(pMatchId, pPlayer, pDeck) {
  const lCollection = await MongoDBConnection.getMatchCollection();
  const key = `${pPlayer}.deck`;
  return lCollection.updateOne(
    { _id: new ObjectId(pMatchId) },
    { $set: { [key]: pDeck } }
  );
}

async function updateMatchStatus(pMatchId, status) {
  const lCollection = await MongoDBConnection.getMatchCollection();
  return lCollection.updateOne(
    { _id: new ObjectId(pMatchId) },
    { $set: { status: status } }
  );
}

async function getMatchDataService(pPlayingPlayerId, pMatchDocument) {
  try {

    if (!pMatchDocument.status) {
      const lStatus = MATCH_STATUS.DeckIsPending;
      try {
        await updateMatchStatus(pMatchDocument._id, lStatus);
        return [lStatus, null];
      } catch (error) {
        return [
          null,
          new StatusCodeError('Updating match status error: ' + error, 400),
        ];
      }
    }
    let lMatchInit = pMatchDocument;
    if (matchNeedsInit(pMatchDocument)) {
      lMatchInit = getMatchInit(pMatchDocument);
      await updateMatch(pMatchDocument._id, lMatchInit);
    }

    const lResponse = getMatchResponse(pPlayingPlayerId, lMatchInit);
    return [lResponse, null];
  } catch (e) {
    return [null, `Get match data error : ${e}`];
  }
}

async function getAllMatchesService() {
  try {
    const lCollection = await MongoDBConnection.getMatchCollection();
    const lMatches = await lCollection.find().toArray();
    const lResponse = lMatches.map((elem) => {
      return {
        player1: {
          deck: getDeckLength(elem.player1),
          hand: getHandLength(elem.player1),
        },
        player2: {
          deck: getDeckLength(elem.player2),
          hand: getHandLength(elem.player2),
        },
      };
    });
    return [lResponse, null];
  } catch (e) {
    return [null, `Get all matches error : ${e}`];
  }
}

async function getCardsInfo(pDeck) {
  let lKeys = pDeck.map((elem) => {
    return { key: elem.key };
  });
  const lCollection = await MongoDBConnection.getCardsCollection();
  return lCollection
    .find({ $or: lKeys })
    .project({
      info: 1,
      key: 1,
      name: 1,
      title: 1,
    })
    .toArray();
}

function shuffle(cards) {
  const a = cards.slice()
  for (let i = a.length; i; i--) {
    let j = Math.floor(Math.random() * i);
    [a[i - 1], a[j]] = [a[j], a[i - 1]];
  }
  return a
}

async function all_defined(deck) {
  const lCards = await getCardsInfo(deck);
  if (lCards?.length === 20) {
    return shuffle(lCards);
  }
  return null;
}

async function initDeckService(pPlayingPlayerId, pDeck) {
  if (!pDeck || !pDeck.length || pDeck.length !== 20) {
    return [null, `Deck initialisation requires 20 cards`];
  }
  if (!all_different(pDeck)) {
    return [null, `There is twice the same card in your deck`];
  }
  const lCards = await all_defined(pDeck);
  if (!lCards) {
    return [null, `Unknown card definitions found in deck.`];
  }
  try {
    const lMatchDocument = await getCurrentMatch(pPlayingPlayerId);
    if (!lMatchDocument) {
      return [null, new StatusCodeError('There is no match associated', 404)];
    }
    if (lMatchDocument.status !== MATCH_STATUS.DeckIsPending) {
      return [null, `The match status is not pending a deck`];
    }
    const lPlayer = getConnectedPlayer(pPlayingPlayerId, lMatchDocument);
    const lMatchPlayer = lMatchDocument[lPlayer];
    if (getDeckLength(lMatchPlayer)) {
      return [null, `A deck is already defined`];
    }

    await updatePlayerDeck(lMatchDocument._id, lPlayer, lCards);
    return [{ player: lPlayer, deck: 'initialized' }, null];
  } catch (e) {
    return [null, `Get all matches error : ${e}`];
  }
}

function whoseTurn(pPlayingPslayerId, pMatchDocument){
  const lPlayer = getConnectedPlayer(pPlayingPlayerId, pMatchDocument);
  if(!pMatchDocument[lPlayer].turn){
    throw new StatusCodeError('Not your turn', 400)
  }
  return lPlayer
}

async function pickCardService(lPlayer, lMatchDocument) {
  try {
    const lMatchPlayer = lMatchDocument[lPlayer]
    if (lMatchPlayer.cardPicked == true) {
      throw 'Card already picked'
    }
    if (!getDeckLength(lMatchPlayer)) {
      throw 'Deck is empty'
    }
    const lNewDeck = [...lMatchPlayer.deck];
    const lPickedCard = lNewDeck.splice(0, 1)[0];

    const lNewHand = [...lMatchPlayer.hand, lPickedCard];
    const lCurrentMatch = {
      ...lMatchDocument,
      [lPlayer]: {
        ...lMatchPlayer,
        deck: lNewDeck,
        hand: lNewHand,
        cardPicked: true,
      },
    };
    await updateMatch(lMatchDocument._id, lCurrentMatch);
    return [lPickedCard, null];
  } catch (error) {
    return [null, new StatusCodeError(error, 400)];
  }
}

function getCardIndexFromKey(pCards, pCardKey) {
  return pCards.findIndex((elem) => elem.key === pCardKey);
}

async function playCardService(pMatchDocument, lPlayer, pCardKey) {
  try {
    return await playCardService_impl(pMatchDocument,lPlayer,pCardKey)
  } catch (error) {
    return [null, new StatusCodeError(error, 400)];
  }
}
async function playCardService_impl(lMatchDocument, lPlayer, pCardKey) {
  const lMatchPlayer = lMatchDocument[lPlayer];

    if (!lMatchPlayer.turn) {
      throw 'Not your turn';
    }
    if (!lMatchPlayer.board?.length >= 5) {
      throw 'Board full'; //todo
    }
    const lCardIndex = getCardIndexFromKey(lMatchPlayer.hand, pCardKey);
    if (lCardIndex === -1) {
      throw 'Card is not in the hand'
    }
    const lNewHand = [...lMatchPlayer.hand];
    const removedCards = lNewHand.splice(lCardIndex, 1);
    
    const lAttackCard = { ...removedCards[0], attack: true };
    const lNewBoard = [...lMatchPlayer.board, lAttackCard];
    const lCurrentMatch = {
      ...lMatchDocument,
      [lPlayer]: {
        ...lMatchPlayer,
        hand: lNewHand,
        board: lNewBoard,
      },
    };
    await updateMatch(lMatchDocument._id, lCurrentMatch);
    return [{ player: { board: lNewBoard, hand: lNewHand } }, null];
}


async function attackCardService(pPlayingPlayerId, pCard, pEnemyCard) {
  try {
    const lMatchDocument = await getCurrentMatch(pPlayingPlayerId);
    const lPlayer = getConnectedPlayer(pPlayingPlayerId, lMatchDocument);

    const lEnemy = WHO[lPlayer].enemy;
    const lMatchPlayer = { ...lMatchDocument[lPlayer] };
    const lEnemyPlayer = { ...lMatchDocument[lEnemy] };
    const lPlayerBoard = lMatchPlayer.board;
    const lEnemyBoard = lEnemyPlayer.board;
    let lStatus = lMatchDocument.status;


    let lCardIndex = getCardIndexFromKey(lPlayerBoard, pCard); 
    if (lCardIndex === -1) {
      throw "Player's card is not on the board"
    }

    const lCard = lPlayerBoard[lCardIndex];
    if (lCard.attack === true) {
      throw 'This card has already attacked'
    }

    const lEnemyCardIndex = getCardIndexFromKey(lEnemyBoard, pEnemyCard);
    if (lEnemyCardIndex === -1) {
      throw "Ennemy's card is not on the board"
    }
    const lEnemyCard = lEnemyBoard[lEnemyCardIndex];
    //starts attack
    lCard.attack = true;

    if (lCard.info.attack > lEnemyCard.info.defense) {
      const lDamage = lCard.info.attack - lEnemyCard.info.defense;
      lEnemyPlayer.hp -= lDamage;
      if (lEnemyPlayer.hp <= 0) {
        lEnemyPlayer.turn = false;
        lMatchPlayer.turn = false;
        lStatus = `Player ${lPlayer} won`;
      }
      lEnemyBoard.splice(lEnemyCardIndex, 1);
    } else if (lCard.info.attack < lEnemyCard.info.defense) {
      lPlayerBoard.splice(lCardIndex, 1);
    } else {
      lPlayerBoard.splice(lCardIndex, 1);
      lEnemyBoard.splice(lEnemyCardIndex, 1);
    }

    const lCurrentMatch = {
      status: lStatus,
      [lPlayer]: lMatchPlayer,
      [lEnemy]: lEnemyPlayer,
    };
    await updateMatch(lMatchDocument._id, lCurrentMatch);
    return [
      {
        status: lStatus,
        [lPlayer]: { board: lPlayerBoard, hp: lMatchPlayer.hp },
        [lEnemy]: { board: lEnemyBoard, hp: lEnemyPlayer.hp },
      },
      null,
    ];
  } catch (error) {
    return [null, new StatusCodeError(error, 400)];
  }
}

async function attackPlayerService(pPlayingPlayerId, pCard) {
  try {
    const lMatchDocument = await getCurrentMatch(pPlayingPlayerId);
    if (!lMatchDocument) {
      return [null, new StatusCodeError('There is no match associated', 404)];
    }
    const lPlayer = getConnectedPlayer(pPlayingPlayerId, lMatchDocument);
    const lEnemy = WHO[lPlayer].enemy;
    const lMatchPlayer = { ...lMatchDocument[lPlayer] };
    const lEnemyPlayer = { ...lMatchDocument[lEnemy] };
    const lPlayerBoard = lMatchPlayer.board;
    const lEnemyBoard = lEnemyPlayer.board;
    let lStatus = lMatchDocument.status;

    if (!lMatchPlayer.turn) {
      throw 'Not your turn'
    }

    let lCardIndex = getCardIndexFromKey(lPlayerBoard, pCard);
    if (lCardIndex === -1) {
      throw "Player's card is not on the board"
    }

    const lCard = lPlayerBoard[lCardIndex];
    if (lCard.attack === true) {
      throw 'This card has already attacked'
    }

    if (lEnemyBoard.length) {
      throw 'Enemy is still moving (their board is not empty)'
    }
    //starts attack
    lCard.attack = true;

    lPlayerBoard.splice(lCardIndex, 1); // missing in original code...
    lEnemyPlayer.hp -= lCard.info.attack;
    if (lEnemyPlayer.hp <= 0) {
      lEnemyPlayer.turn = false;
      lMatchPlayer.turn = false;
      lStatus = `Player ${lPlayer} won`;
    }

    const lCurrentMatch = {
      status: lStatus,
      [lPlayer]: lMatchPlayer,
      [lEnemy]: lEnemyPlayer,
    };
    await updateMatch(lMatchDocument._id, lCurrentMatch);
    return [
      {
        status: lStatus,
        [lPlayer]: { board: lPlayerBoard, hp: lMatchPlayer.hp },
        [lEnemy]: { board: lEnemyBoard, hp: lEnemyPlayer.hp },
      },
      null,
    ];
  } catch (error) {
    return [null, new StatusCodeError(error, 400)];
  }
}

async function endTurnService(pPlayingPlayerId) {
  try {
    const lMatchDocument = await getCurrentMatch(pPlayingPlayerId);
    if (!lMatchDocument) {
      return [null, new StatusCodeError('There is no match associated', 404)];
    }
    const lPlayer = getConnectedPlayer(pPlayingPlayerId, lMatchDocument);
    const lEnemy = WHO[lPlayer].enemy;
    const lMatchPlayer = { ...lMatchDocument[lPlayer] };
    const lEnemyPlayer = { ...lMatchDocument[lEnemy] };

    if (!lMatchPlayer.turn) {
      throw 'Not your turn'
    }
    lMatchPlayer.cardPicked = false;
    lMatchPlayer.turn = false;
    lEnemyPlayer.turn = true;
    const status = MATCH_STATUS[lEnemy]

    const lCurrentMatch = {
      status,
      [lPlayer]: lMatchPlayer,
      [lEnemy]: lEnemyPlayer,
    };
    const res= await updateMatch(lMatchDocument._id, lCurrentMatch);
    return [`End of turn ${lPlayer}`, null];
  } catch (error) {
    return [null, new StatusCodeError(error, 400)];
  }
}

async function finishMatchService(pPlayingPlayerId) {
  try {
    const lMatchDocument = await getCurrentMatch(pPlayingPlayerId);
    if (!lMatchDocument) {
      return [null, new StatusCodeError('There is no match associated', 404)];
    }
    const lPlayer = getConnectedPlayer(pPlayingPlayerId, lMatchDocument);
    const lEnemy = WHO[lPlayer].enemy;

    if (
      lMatchDocument[lPlayer].turn == true ||
      lMatchDocument[lEnemy].turn == true
    ) {
      throw 'Match is not finished'
    }
    const lMatchId = lMatchDocument._id;
    await removeMatch(lMatchId);
    await removeMatchmaking(lMatchId);
    return [lMatchDocument.status, null];
  } catch (error) {
    return [null, new StatusCodeError(error, 400)];
  }
}

module.exports = {
  getMatchDataService,
  getAllMatchesService,
  initDeckService,
  pickCardService,
  attackCardService,
  attackPlayerService,
  endTurnService,
  finishMatchService,
  playCardService
};
