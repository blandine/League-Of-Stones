var express = require('express');
const { createUserAccount, deleteUserAccount } = require('../api/usersApi');
var router = express.Router();

router.put('/user', async (req, res, next) => {
  createUserAccount(req, res);
});

router.post('/login', async (req, res, next) => {
  userLogin(req, res);
});

router.post('/logout', async (req, res, next) => {
  userLogout(req, res);
});

const users = '/users';
router.get(`${users}/getAll`, (req, res, next) => {
  getUsers(req, res);
});

router.get(`${users}/unsubscribe`, (req, res, next) => {
  deleteUserAccount(req, res);
});

router.get(`${users}/amIConnected`, function (req, res) {
  isUserConnected(req, res);
});

module.exports = router;
