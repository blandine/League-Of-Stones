var tools = require('../old/tools');
var usersRouter = require('./usersRouter');
var express = require('express');
var router = express.Router();
var { createAccount, login, logout } = require('../services/usersService');
const { processServiceResponse, checkAuthentication } = require('./utils');

router.get('/', function (req, res) {
  tools.sendData(
    res,
    { message: 'League of Stones server is up ! Welcome :) ' },
    req
  );
});

router.use('/', usersRouter);

module.exports = router;
