const createError = require('http-errors');

const { SingleStore } = require('./utils/session.js');
function requiresAuth(req, res, next) {
    if (req.session && req.session.connectedUser !==null) {
        next();
    }
    else {
        next(createError(401, "User not connected."));
    }
}

module.exports = { requiresAuth };