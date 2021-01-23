var express = require('express');
var router = express.Router();

const { processServiceResponse } = require('./utils');
var { getAllUsers, deleteAccount } = require('../services/usersService');

router.get('/getAll', (req, res, next) => {
  processServiceResponse(getAllUsers(), res);
});

router.get('/unsubscribe', (req, res, next) => {
  const lPassword = req.query.password;
  const lEmail = req.query.email;
  if (!lPassword || !lEmail) {
    res.status(400);
    res.json({
      error: 'Missing parameters. Parameters are : email, password.',
    });
    return;
  }
  if (!req.session.connectedUser || !req.session.connectedUser.email) {
    res.status(500);
    res.json({
      error: 'User has been disconnected.',
    });
    return;
  }
  processServiceResponse(
    deleteAccount(lEmail, lPassword).then((response) => {
      req.session.connectedUser = null;
      return response;
    }),
    res
  );
});

router.get('/amIConnected', function (req, res) {
  if (req.session.connectedUser) {
    res.status(200);
    res.json({
      connectedUser: {
        email: req.session.connectedUser.email,
        name: req.session.connectedUser.name,
      },
    });
  } else {
    res.status(200);
    res.json({
      connectedUser: null,
    });
  }
});

module.exports = router;
