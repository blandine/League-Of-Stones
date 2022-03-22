var express = require('express');
const {
  getMatchData, getAllMatches, initDeck, pickCard, playCard, attackCard, endTurn, finishMatch, attackPlayer
} = require('../controllers/matchController.js');
const { hasEnemyCardQueryParam, hasCardQueryParam, canPlay } = require('../middlewares.js');
var router = express.Router();


router.get('/getMatch', getMatchData);
router.get('/getAllMatch', getAllMatches);
router.get('/initDeck', initDeck);

router.get('/pickCard', canPlay, pickCard);
router.get('/playCard', hasCardQueryParam, canPlay, playCard);
router.get('/attack', hasCardQueryParam, hasEnemyCardQueryParam, canPlay, attackCard);
router.get('/attackPlayer', hasCardQueryParam, canPlay, attackPlayer);
router.get('/endTurn', canPlay, endTurn);
router.get('/finishMatch', finishMatch);

module.exports = router;
