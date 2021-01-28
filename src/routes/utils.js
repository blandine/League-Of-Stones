class StatusCodeError {
  message;
  code;
  constructor(message, code) {
    this.message = message;
    this.code = code ? code : 400;
  }
}


function sendResponse([response, error], res) {
  if (error) {
    sendError(error,res); 
  } else {
    res.json(response);
  }
}

function sendError(error, res) {
    //console.error('Caught error : ' + error);
    res.status(error.code == undefined ? 400 : error.code);
    res.json(error); 
}
module.exports = { sendResponse,sendError, StatusCodeError };
