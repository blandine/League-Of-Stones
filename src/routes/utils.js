const { SingleStore } = require("../utils/session");

class StatusCodeError {
  message;
  code;
  constructor(message, code) {
    this.message = message;
    this.code = code ? code : 400;
  }
}

function sendResponse([response, error], res, req) {
  if (error) {
    sendError(error, res);
  } else {
    if (typeof response == 'string') {
      response = { message: response };
    }
    if (req.header('WWW-Authenticate')) {
       SingleStore.sessionStore.set(
        req.header('WWW-Authenticate'),
        req.session
      );
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
