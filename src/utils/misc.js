
const PLAYER1 = 'player1';
const PLAYER2 = 'player2';

const MATCH_STATUS = {
  DeckIsPending: 'Deck is pending',
  [PLAYER1]: 'Turn : player 1',
  [PLAYER2]: 'Turn : player 2',
};

const WHO = {
  [PLAYER1]: { me: PLAYER1, enemy: PLAYER2 },
  [PLAYER2]: { me: PLAYER2, enemy: PLAYER1 },
};

function all_different(array) {
  var ids = {};
  for (var elem of array) {
    if (ids[elem.key] === undefined) {
      ids[elem.key] = elem;
    } else {
      return false;
    }
  }
  return true;
}




module.exports = {
  PLAYER1,
  PLAYER2,
  WHO,
  MATCH_STATUS,
  all_different,
};
