const { SingleStore } = require("../utils/session");

class StatusCodeError extends Error {
  message;
  status;
  constructor(message, status) {
    super();
    this.message=message;
    this.code = status ? status : 400;
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
      function (error) {
        if(error){
          throw new Error('Error while destroying session '+e)
        }
      }
    )
  }
}


function sendResponse([response, error], res, req) {
  if (error) {  
    return sendError(error, res);
  } else {
    if (typeof response == 'string') {
      response = { message: response };
    }
    if (req && req.session.connectedUser) {
      if (req.destroy == true) {
        destroySession(req);
      } else {
        saveSession(req)
      }
    }
    res.json(response);
  }
}

function sendError(error, res) {
  //console.error('Caught error : ' + error);
  if (typeof error == 'string') {  
    error = new StatusCodeError(error)
  } 
  res.status(error.code ?? 400);
  res.json(error);
}
module.exports = { sendResponse, sendError, StatusCodeError };
