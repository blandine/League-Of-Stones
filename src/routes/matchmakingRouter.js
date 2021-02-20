var express = require('express');
const {
    participate,
    unparticipate,
    getAllMatchmakings,
    sendRequest,
    acceptRequest,
} = require('../controllers/matchmakingController');
const { requiresMatchmakingId } = require('../middlewares');
var router = express.Router();

router.get('/participate', participate);
router.get('/unparticipate',requiresMatchmakingId, unparticipate);
router.get('/getAll', getAllMatchmakings);
router.get('/request',requiresMatchmakingId, sendRequest);
router.get('/acceptRequest',requiresMatchmakingId, acceptRequest);

module.exports = router;
