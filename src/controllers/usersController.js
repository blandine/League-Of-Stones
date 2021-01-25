const { processServiceResponse } = require('../routes/utils');
var {
  getAllUsers,
  deleteAccount,
  createAccount,
  login,
  logout,
} = require('../services/usersService');

function createUserAccount(req, res) {
  const { name, email, password } = req.body;
  if (!password || !email || !name) {
    res.status(400);
    res.json({
      error: 'Missing parameters. Parameters are : name, email, password.',
    });
    return;
  }
  processServiceResponse(createAccount(email, password, name), res);
}

function userLogin(req, res) {
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
}

function userLogout(req, res) {
  const [, err] = checkAuthentication(req, res);
  if (err) {
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
}

function getUsers(req, res) {
  processServiceResponse(getAllUsers(), res);
}

function deleteUserAccount(req, res) {
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
}

function isUserConnected(req, res) {
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
}

module.exports = {
  createUserAccount,
  userLogin,
  userLogout,
  getUsers,
  deleteUserAccount,
  isUserConnected,
};
