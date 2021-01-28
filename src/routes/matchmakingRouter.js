var express = require('express');
const {
    participate,
    unparticipate,
    getAllMatchmakings,
    sendRequest,
    acceptRequest,
} = require('../controllers/matchmakingController');
var router = express.Router();

router.get('/participate', participate);
router.get('/unparticipate', unparticipate);
router.get('/getAll', getAllMatchmakings);
router.get('/request', sendRequest);
router.get('/acceptRequest', acceptRequest);

module.exports = router;
