var express = require('express');
const {
  getMatchData,getAllMatches,initDeck,pickCard,playCard,attackCard,endTurn,finishMatch
} = require('../controllers/matchController.js');
var router = express.Router();


router.get('/getMatch', getMatchData);
router.get('/getAllMatch', getAllMatches);
router.get('/initDeck', initDeck);

router.get('/pickCard', pickCard);
router.get('/playCard', playCard);
router.get('/attack', attackCard);
router.get('/attackPlayer', attackCard);
router.get('/endTurn', endTurn);
router.get('/finishMatch', finishMatch);

module.exports = router;
