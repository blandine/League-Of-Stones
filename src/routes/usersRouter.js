var express = require('express');
const {
  createUserAccount,
  deleteUserAccount,
  userLogin,
  userLogout,
  getUsers,
  isUserConnected,
} = require('../controllers/usersController.js');
var router = express.Router();

router.put('/user', createUserAccount);

router.post('/login', userLogin);

router.post('/logout', userLogout);

const users = '/users';
router.get(`${users}/getAll`, getUsers);

router.get(`${users}/unsubscribe`, deleteUserAccount);

router.get(`${users}/amIConnected`, isUserConnected);

module.exports = router;
