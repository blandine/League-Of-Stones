const { processServiceResponse, StatusCodeError } = require('../routes/utils');
var {
  getAllUsers,
  deleteAccount,
  createAccount,
  login,
  logout,
} = require('../services/usersService');

async function createUserAccount(req, res) {
  const { name, email, password } = req.body;
  let response, error;
  if (!password || !email || !name) {
    error = new StatusCodeError('Missing parameters. Parameters are : name, email, password.')
  } else {
    [response, error] = await createAccount(email, password, name);
  }
  processServiceResponse([response, error], res);
}

async function userLogin(req, res) {
  const { email, password } = req.body;
  let response, error;
  if (!password || !email) {
    error = new StatusCodeError('Missing parameters. Parameters are : email, password.')
  } else {
    [response, error] = await login(email, password, req.session.id);
    if (response && !error) {
      req.session.connectedUser = response;
    }
  }
  processServiceResponse([response, error], res);
}

async function userLogout(req, res) {

  const lUserId = req.session.connectedUser.id;
  [response, error] = await logout(lUserId);
  if (response) {
    req.session.connectedUser = null;
  }
  processServiceResponse([response, error], res);

}

async function getUsers(req, res) {
  const lResponse = await getAllUsers();
  processServiceResponse(lResponse, res);
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
    const [response, error] = await deleteAccount(lEmail, lPassword);
    if (response) {
      req.session.connectedUser = null;
    }
    processServiceResponse([response, error], res);

  }
  catch (err) {
    processServiceResponse([, err], res);
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
  processServiceResponse([lResponse, null], res);
}

module.exports = {
  createUserAccount,
  userLogin,
  userLogout,
  getUsers,
  deleteUserAccount,
  isUserConnected,
};
