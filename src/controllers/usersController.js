const { sendResponse, StatusCodeError, sendError } = require('../routes/utils');
var {
  getAllUsers,
  deleteAccount,
  createAccount,
  login,
  logout,
} = require('../services/usersService');
const { SingleStore } = require('../utils/session');

async function createUserAccount(req, res) {
  const { name, email, password } = req.body;
  if (!password || !email || !name) {
    const error = new StatusCodeError('Missing parameters. Parameters are : name, email, password.')
    sendError(error, res)
  }

  const response = await createAccount(email, password, name);
  sendResponse(response, res);
}

async function userLogin(req, res) {
  const { email, password } = req.body;
  if (!password || !email) {
    const error = new StatusCodeError('Missing parameters. Parameters are : email, password.')
    sendError(error, res)
  } else {
    const [result, error] = await login(email, password, req.session.id);
    if (result && !error) {
      req.session.connectedUser = result;
    }
    sendResponse([result, error], res);
  }
}

async function userLogout(req, res) {

  const lUserId = req.session.connectedUser.id;
  const [result, error] = await logout(lUserId);
  if (result) {
    SingleStore.sessionStore.destroy(
      req.session.connectedUser.token,//todo: check me
      function (error, session) {
       console.log("session destroyed")
      }
    )
  }

  sendResponse([result, error], res);


}

async function getUsers(req, res) {
  const lResponse = await getAllUsers();
  sendResponse(lResponse, res);
}

async function deleteUserAccount(req, res) {
  const lPassword = req.query.password;
  const lEmail = req.query.email;
  try {
    if (!lPassword || !lEmail) {
      throw new StatusCodeError('Missing parameters. Parameters are : email, password.')
    }
    if (!req.session.connectedUser || !req.session.connectedUser.email) {
      throw new StatusCodeError('User has been disconnected.', 500)
    }
    const [result, error] = await deleteAccount(lEmail, lPassword);
    if (result) {
      SingleStore.sessionStore.destroy(
        req.session.connectedUser.token,//todo: check me
        function (error, session) {
         console.log("session destroyed")
        }
      )
    }
    sendResponse([result, error], res);

  }
  catch (err) {
    sendError(err, res);
  }
}

function isUserConnected(req, res) {
  let lResponse = { connectedUser: null };
  if (req.session.connectedUser) {
    lResponse.connectedUser = {
      email: req.session.connectedUser.email,
      name: req.session.connectedUser.name,
    }
  }
  sendResponse([lResponse, null], res);
}

module.exports = {
  createUserAccount,
  userLogin,
  userLogout,
  getUsers,
  deleteUserAccount,
  isUserConnected,
};
