var tools = require('../tools');
var usersRouter = require('./usersRouter');
var express = require('express');
var router = express.Router();
var { createAccount, login, logout } = require('../services/usersService');
const { processServiceResponse,checkAuthentication } = require('./utils');

router.get('/', function (req, res) {
  tools.sendData(
    res,
    { message: 'League of Stones server is up ! Welcome :) ' },
    req
  );
});

router.put('/user', async (req, res, next) => {
  const { name, email, password } = req.body;
  if (!password || !email || !name) {
    res.status(400);
    res.json({
      error: 'Missing parameters. Parameters are : name, email, password.',
    });
    return;
  }
  processServiceResponse(createAccount(email, password, name), res);
});

router.post('/login', async (req, res, next) => {
  const { email, password } = req.body;
  processServiceResponse(
    login(email, password, req.session.id).then(([response, err]) => {
      if (err) {
        return [null, err];
      }
      req.session.connectedUser = response;
      return [response, err];
    }),
    res
  );
});

router.post('/logout', async (req, res, next) => {
  const [,err]=checkAuthentication(req,res);
  if(err){
    return;
  }
  const lUserId = req.session.connectedUser._id;
  processServiceResponse(
    logout(lUserId).then(([response, err]) => {
      if (err) {
        return [null, err];
      }
      req.session.connectedUser = null;
      return [response, null];
    }),
    res
  );
});

router.use('/users', usersRouter);

module.exports = router;
