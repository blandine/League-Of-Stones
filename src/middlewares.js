const createError = require('http-errors');

function requiresAuth(req, res, next) {
    if (req.session && req.session.connectedUser) {
        next();
    }
    else {
        next(createError(401, "User not connected."));
    }
}

module.exports = { requiresAuth };