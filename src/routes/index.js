var usersRouter = require('./usersRouter');
var express = require('express');
const { createUserAccount,userLogin } = require('../controllers/usersController');
const { requiresAuth } = require('../middlewares');
var router = express.Router();

router.get('/', function (req, res,next) {
  const result = { message: 'League of Stones server is up ! Welcome :) hahahahah ' }
  res.json(result).status(200);
  
});
router.put('/user', createUserAccount);

router.post('/login', userLogin);

router.use('/',requiresAuth, usersRouter);

module.exports = router;
