var express = require('express');
const {
  deleteUserAccount,
  userLogout,
  getUsers,
  isUserConnected,
} = require('../controllers/usersController.js');
var router = express.Router();


router.post('/logout', userLogout);

const users = '/users';
router.get(`${users}/getAll`, getUsers);

router.get(`${users}/unsubscribe`, deleteUserAccount);

router.get(`${users}/amIConnected`, isUserConnected);

module.exports = router;
