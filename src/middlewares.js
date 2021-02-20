const createError = require('http-errors');

function requiresAuth(req, res, next) {
    if (req.session && req.session.connectedUser) {
        next();
    }
    else {
        next(createError(401, "User not connected."));
    }
}
function requiresMatchmakingId(req, res, next) {
    if (req.session && req.session.matchmakingId) {
        next();
    }
    else {
        next(createError(400, "Matchmaking is undefined. Participate to have one!"));
    }
}
module.exports = { requiresAuth,requiresMatchmakingId };