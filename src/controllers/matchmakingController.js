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
    sendError(new StatusCodeError('Session is missing email', 400), res);
    return;
  }
  
  const [result, error] = await participateService(lUser);
  
  if (error) {
    sendError(new StatusCodeError(error, 400), res);
    return;
  }
  
  req.session.matchmakingId = result.matchmakingId;
  sendResponse([result, error], res, req);
}

async function unparticipate(req, res) {
  const lMatchmakingId = req.session.matchmakingId;
  
  const response = await unparticipateService(lMatchmakingId);
  
  delete req.session.matchmakingId;
  sendResponse(response, res, req);
}

async function getAllMatchmakings(req, res) {
  if (!req.session.connectedUser || !req.session.connectedUser.id) {
    sendError(new StatusCodeError('Session is invalid', 400), res);
    return;
  }

  const lPlayingPlayerId = req.session.connectedUser.id;
  const response = await getAllAvailableMatchmakingsService(lPlayingPlayerId);
 
  sendResponse(response, res, req);
}

async function sendRequest(req, res) {
  const lPlayingPlayerId = req.session.connectedUser.id;
  const lPlayingPlayerName = req.session.connectedUser.name;
  const lRequestedMatchmakingId = req.query.matchmakingId;
  
  if (!lRequestedMatchmakingId || lRequestedMatchmakingId.length == 0) {
    sendError(
      new StatusCodeError('Query parameter matchmakingId is not valid', 400),
      res
    );
    return;
  }

  const lPlayerMatchmakingId = req.session.matchmakingId;
  
  if (lPlayerMatchmakingId == lRequestedMatchmakingId) {
    sendError(
      new StatusCodeError(
        "You can't send a request to your own matchmakingid",
        400
      ),
      res
    );
    return;
  }

  const response = await sendRequestService(
    lRequestedMatchmakingId,
    lPlayingPlayerId,
    lPlayingPlayerName,
    lPlayerMatchmakingId
  );

  sendResponse(response, res, req);
}

async function acceptRequest(req, res) {
  const lPlayingPlayerId = req.session.connectedUser.id;
  const lPlayingPlayerName = req.session.connectedUser.name;
  const lMatchmakingId = req.session.matchmakingId;
  const lRequestedMatchmakingId = req.query.matchmakingId;
  
  if (!lRequestedMatchmakingId || lRequestedMatchmakingId.length == 0) {
    sendError(
      new StatusCodeError('Query parameter matchmakingId is not valid', 400),
      res
    );
    return;
  }

  const response = await acceptRequestService(
    lMatchmakingId,
    lRequestedMatchmakingId,
    lPlayingPlayerId,
    lPlayingPlayerName
  );
  
  sendResponse(response, res, req);
}

module.exports = {
  participate,
  unparticipate,
  getAllMatchmakings,
  sendRequest,
  acceptRequest,
};
