const createError = require('http-errors');

const { SingleStore } = require('./utils/session.js');

function requiresAuth(req, res, next) {
    const lToken = req.header('WWW-Authenticate');
    if (!lToken) {
        next(createError(401));
        return;
    }
    SingleStore.sessionStore.get(
        lToken,
        function (error, session) {
            if (error) {
                next(createError(401, error));
                return;
            }
            if (session && session.connectedUser) {
                req.session = session;
                next();
            }
            else {
                req.session = null;
                next(createError(401, "User not connected."));
            }
        }
    )
}

module.exports = { requiresAuth };