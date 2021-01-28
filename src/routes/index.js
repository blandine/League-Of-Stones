const usersRouter = require('./usersRouter');
const matchRouter = require('./matchRouter');

var express = require('express');
const { createUserAccount,userLogin } = require('../controllers/usersController');
const { requiresAuth } = require('../middlewares');
const { getCardsService } = require('../services/cardsService');
const router = express.Router();

router.get('/', function (req, res,next) {
  const result = { message: 'League of Stones server is up ! Welcome :) hahahahah ' }
  res.json(result).status(200);
  
});
router.put('/user', createUserAccount);

router.post('/login', userLogin);

router.get('/cards', async function(req,res){
  const [response,err] = await getCardsService();
  sendResponse([response,err],res)
});
router.use('/',requiresAuth, usersRouter);
router.use('/match',requiresAuth, matchRouter);


module.exports = router;
