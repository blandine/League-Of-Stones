class StatusCodeError {
  message;
  code;
  constructor(message, code) {
    this.message = message;
    this.code = code ? code : 400;
  }
}
function processServiceResponse(pServiceResponse, res) {
  let [lResult, error] = pServiceResponse;
  if (error) {
    //console.error('Caught error : ' + error);
    res.status(error.code == undefined ? 400 : error.code);
    res.json(error);
  } else {
    res.json(lResult);
  }
}
module.exports = { processServiceResponse, StatusCodeError };
