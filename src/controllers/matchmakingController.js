const { sendResponse, sendError, StatusCodeError } = require('../routes/utils');

async function participate(req, res) {
    const lUser =req.session.connectedUser;
  const lEmail = lUser.email;
  if(!lEmail){
      sendError(new StatusCodeError("Session does not contain email",400))
  }
  const [result,error] = await participateService(lUser);
  if(result && !error){
      req.session.matchmakingId = result.matchmakingId;
  }
  sendResponse(response, res);
}
async function unparticipate(req, res) {
  const lPlayingPlayerId = req.session.connectedUser.id;
  const response = await Service(lPlayingPlayerId);
  sendResponse(response, res);
}
async function getAllMatchmakings(req, res) {
  const lPlayingPlayerId = req.session.connectedUser.id;
  const response = await Service(lPlayingPlayerId);
  sendResponse(response, res);
}
async function sendRequest(req, res) {
  const lPlayingPlayerId = req.session.connectedUser.id;
  const response = await Service(lPlayingPlayerId);
  sendResponse(response, res);
}
async function acceptRequest(req, res) {
  const lPlayingPlayerId = req.session.connectedUser.id;
  const response = await Service(lPlayingPlayerId);
  sendResponse(response, res);
}
module.exports = {
  participate,
  unparticipate,
  getAllMatchmakings,
  sendRequest,
  acceptRequest,
};
