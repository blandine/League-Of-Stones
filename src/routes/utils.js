function checkAuthentication(req, res) {
  const token = req.header('WWW-Authenticate');
  if (!token) {
    return [null, new StatusCodeError('Missing token.', 400)];
  }
  if (!req.session.connectedUser) {
    return [null, new StatusCodeError('User is not connected.', 500)];
  }
  return ["ok", null];
}


class StatusCodeError extends Error{
  constructor(message, code) {
    this.message = message;
    this.code = code ? code : 400;
  }
}
function processServiceResponse(pServiceResponse, res) {
  let [lResult, error] = pServiceResponse;
  if (error) {
    console.error('Caught error : ' + error);
    res.status(error.code == undefined ? 400 : error.code);
    res.json(error);
  } else {
    res.json(lResult);
  }
}
module.exports = { processServiceResponse, checkAuthentication, StatusCodeError };
