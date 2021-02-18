var express = require('express');
const router = express.Router();

const { requiresAuth } = require('../middlewares');
const usersRouter = require('./usersRouter');
const matchRouter = require('./matchRouter');
const matchmakingRouter = require('./matchmakingRouter');


const { createUserAccount, userLogin } = require('../controllers/usersController');
const { getCards } = require('../controllers/cardsController');
const { deleteDb } = require('../services/serverService');
const { sendResponse } = require('./utils');


router.get('/', function (req, res, next) {
  const message = 'League of Stones server is up ! Welcome :) hahahahah ';
  sendResponse([message, null], res);
});

router.get('/resetServer', async function (req, res, next) {
  const lResult = await deleteDb();
  sendResponse(lResult, res);
});

router.put('/user', createUserAccount);
router.post('/login', userLogin);

router.get('/cards', getCards);
router.use('/', requiresAuth, usersRouter);
router.use('/match', requiresAuth, matchRouter);
router.use('/matchmaking', requiresAuth, matchmakingRouter);


module.exports = router;
