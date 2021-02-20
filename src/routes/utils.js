const { SingleStore } = require("../utils/session");

class StatusCodeError {
  message;
  code;
  constructor(message, code) {
    this.message = message;
    this.code = code ? code : 400;
  }
}
function saveSession(req) {
  const token = req.header('WWW-Authenticate');
  if (token) {
    SingleStore.sessionStore.set(
      token,
      req.session
    );
  }
}
function destroySession(req) {
  const token = req.header('WWW-Authenticate');
  if (token) {
    SingleStore.sessionStore.destroy(
      token,
      function (_error) {
        console.log("session destroyed")
      }
    )
  }
}


function sendResponse([response, error], res, req, save = true) {
  if (error) {
    sendError(error, res);
  } else {
    if (typeof response == 'string') {
      response = { message: response };
    }
    if (save) {
      saveSession(req);
    } else {
      destroySession(req)
    }
    res.json(response);
  }
}

function sendError(error, res) {
  //console.error('Caught error : ' + error);
  res.status(error.code == undefined ? 400 : error.code);
  res.json(error);
}
module.exports = { sendResponse, sendError, StatusCodeError };
