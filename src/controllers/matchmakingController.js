const { sendResponse, sendError, StatusCodeError } = require('../routes/utils');
const {
  participateService,
  unparticipateService,
  getAllAvailableMatchmakingsService,
  sendRequestService,
  acceptRequestService,
} = require('../services/matchmakingService');

async function participate(req, res) {
  const lUser = req.session.connectedUser;
  const lEmail = lUser.email;
  if (!lEmail) {
    sendError(new StatusCodeError('Session does not contain email', 400));
  }
  const [result, error] = await participateService(lUser);
  if(error){
    sendError(new StatusCodeError(error, 400))
  }
  req.session.matchmakingId = result.matchmakingId;
  sendResponse([result, error], res);
}
async function unparticipate(req, res) {
  const lPlayingPlayerId = req.session.connectedUser.id;
  const response = await unparticipateService(lPlayingPlayerId);
  delete req.session.matchmakingId;
  sendResponse(response, res);
}
async function getAllMatchmakings(req, res) {
  if(!req.session.connectedUser || !req.session.connectedUser.id){
    sendError(new StatusCodeError("Session is invalid",400),res);
    return;
  }
  const lPlayingPlayerId = req.session.connectedUser.id;
  const response = await getAllAvailableMatchmakingsService(lPlayingPlayerId);
  sendResponse(response, res);
}
async function sendRequest(req, res) {
  const lPlayingPlayerId = req.session.connectedUser.id;
  const lPlayingPlayerName = req.session.connectedUser.name;
  const lMatchmakingId = req.query.matchmakingId;
  if(!lMatchmakingId || lMatchmakingId.length == 0){
    sendError(new StatusCodeError("Query parameter matchmakingId is not valid",400), res)
  }
  if(req.session.matchmakingId == lMatchmakingId){
    sendError(new StatusCodeError("You can't send a request to your own matchmakingid",400), res)
  }
  const response = await sendRequestService(lMatchmakingId, lPlayingPlayerId, lPlayingPlayerName);
  sendResponse(response, res);
}
async function acceptRequest(req, res) {
  const lPlayingPlayerId = req.session.connectedUser.id;
  const lMatchmakingId = req.session.matchmakingId;
  if(!lMatchmakingId || lMatchmakingId.length == 0){
    sendError(new StatusCodeError("Session's matchmakingId is not valid",400), res)
  }
  const lRequestedMatchmakingId = req.query.matchmakingId;
  if(!lRequestedMatchmakingId || lRequestedMatchmakingId.length == 0){
    sendError(new StatusCodeError("Query parameter matchmakingId is not valid",400), res)
  }
  const response = await acceptRequestService(lMatchmakingId, lRequestedMatchmakingId, lPlayingPlayerId);
  sendResponse(response, res);
}
module.exports = {
  participate,
  unparticipate,
  getAllMatchmakings,
  sendRequest,
  acceptRequest,
};
