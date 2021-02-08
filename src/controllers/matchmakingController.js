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
  sendResponse(response, res);
}
async function getAllMatchmakings(req, res) {
  const lPlayingPlayerId = req.session.connectedUser.id;
  const response = await getAllAvailableMatchmakingsService(lPlayingPlayerId);
  sendResponse(response, res);
}
async function sendRequest(req, res) {
  const lPlayingPlayerId = req.session.connectedUser.id;
  const response = await sendRequestService(lPlayingPlayerId);
  sendResponse(response, res);
}
async function acceptRequest(req, res) {
  const lPlayingPlayerId = req.session.connectedUser.id;
  const response = await acceptRequestService(lPlayingPlayerId);
  sendResponse(response, res);
}
module.exports = {
  participate,
  unparticipate,
  getAllMatchmakings,
  sendRequest,
  acceptRequest,
};
