const { sendResponse, sendError, StatusCodeError } = require('../routes/utils');
const {
  participateService,
  unparticipateService,
  getAllAvailableMatchmakingsService,
  sendRequestService,
  acceptRequestService,
} = require('../services/matchmakingService');
const { SingleStore } = require('../utils/session');

async function participate(req, res) {
  const lUser = req.session.connectedUser;
  const lEmail = lUser.email;
  if (!lUser) {
    sendError(new StatusCodeError('Session is empty', 400));
    return;
  }
  if (!lEmail) {
    sendError(new StatusCodeError('Session does not contain email', 400));
    return;
  }
  const [result, error] = await participateService(lUser);
  if (error) {
    sendError(new StatusCodeError(error, 400))
    return;
  }
  req.session.matchmakingId = result.matchmakingId;
  req.session
  sendResponse([result, error], res, req);
}
async function unparticipate(req, res) {
  const lPlayingPlayerId = req.session.connectedUser.id;
  const response = await unparticipateService(lPlayingPlayerId);
  delete req.session.matchmakingId;
  sendResponse(response, res, req);
}
async function getAllMatchmakings(req, res) {
  if (!req.session.connectedUser || !req.session.connectedUser.id) {
    sendError(new StatusCodeError("Session is invalid", 400), res);
    return;
  }
  const lPlayingPlayerId = req.session.connectedUser.id;
  const response = await getAllAvailableMatchmakingsService(lPlayingPlayerId);
  sendResponse(response, res, req);
}
async function sendRequest(req, res) {
  const lPlayingPlayerId = req.session.connectedUser.id;
  const lPlayingPlayerName = req.session.connectedUser.name;
  if (!req.session.matchmakingId) {
    sendError(new StatusCodeError("Your matchmakingId is undefined. Participate first", 400), res);
    return;
  }
  const lMatchmakingId = req.query.matchmakingId;
  if (!lMatchmakingId || lMatchmakingId.length == 0) {
    sendError(new StatusCodeError("Query parameter matchmakingId is not valid", 400), res)
    return;
  }
  if (req.session.matchmakingId == lMatchmakingId) {
    sendError(new StatusCodeError("You can't send a request to your own matchmakingid", 400), res)
    return;
  }
  const response = await sendRequestService(lMatchmakingId, lPlayingPlayerId, lPlayingPlayerName);
  sendResponse(response, res, req);
}
async function acceptRequest(req, res) {
  const lPlayingPlayerId = req.session.connectedUser.id;
  const lMatchmakingId = req.session.matchmakingId;
  if (!lMatchmakingId || lMatchmakingId.length == 0) {
    sendError(new StatusCodeError("Session's matchmakingId is not valid", 400), res)
    return;
  }
  const lRequestedMatchmakingId = req.query.matchmakingId;
  if (!lRequestedMatchmakingId || lRequestedMatchmakingId.length == 0) {
    sendError(new StatusCodeError("Query parameter matchmakingId is not valid", 400), res)
    return;
  }
  const response = await acceptRequestService(lMatchmakingId, lRequestedMatchmakingId, lPlayingPlayerId);
  sendResponse(response, res, req);
}
module.exports = {
  participate,
  unparticipate,
  getAllMatchmakings,
  sendRequest,
  acceptRequest,
};
