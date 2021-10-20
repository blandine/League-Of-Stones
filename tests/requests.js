const app = require("../src/app.js");
const request = require("supertest");

//entry
function requestEntry() {
    return request(app)
        .get("/")
}

//cards
function requestCards() {
    return request(app)
        .get("/cards")
}

//users
function requestCreateUser(pUser) {
    return request(app)
        .put('/user')
        .send({ name: pUser.name, email: pUser.email, password: pUser.password });
}

function requestDeleteUser(pUser, pToken) {
    return request(app)
        .get(`/users/unsubscribe?email=${pUser.email}&password=${pUser.password}`)
        .set('WWW-authenticate', pToken);
}

function requestLogin(pUser) {
    return request(app)
        .post('/login')
        .send({ email: pUser.email, password: pUser.password });
}
function requestLogout(pToken) {
    return request(app)
        .post('/logout')
        .set('WWW-authenticate', pToken);
}

//matchmaking

function requestParticipate(pToken) {
    return request(app)
        .get('/matchmaking/participate')
        .set('WWW-authenticate', pToken);
}
function requestUnparticipate(pToken) {
    return request(app)
        .get('/matchmaking/unparticipate')
        .set('WWW-authenticate', pToken);
}

function requestGetAll(pToken) {
    return request(app)
        .get('/matchmaking/getAll')
        .set('WWW-authenticate', pToken);
}
function requestSendRequest(pToken, pRequestedId) {
    return request(app)
        .get('/matchmaking/request?matchmakingId=' + pRequestedId)
        .set('WWW-authenticate', pToken);
}

function requestAcceptRequest(pToken, pRequestedId) {
    return request(app)
        .get('/matchmaking/acceptRequest?matchmakingId=' + pRequestedId)
        .set('WWW-authenticate', pToken);
}
//match
function requestPickCard(pToken) {
    return request(app)
        .get(`/match/pickCard`)
        .set('WWW-authenticate', pToken);
}
function requestPlayCard(pToken) {
    return request(app)
        .get(`/match/playCard`)
        .set('WWW-authenticate', pToken);
}
function requestAttackPlayer(pCardId, pToken) {
    return request(app)
        .get(`/match/attackPlayer?card=${pCardId}`)
        .set('WWW-authenticate', pToken);
}

function requestAttackCard(pCardId, pToken) {
    return request(app)
        .get(`/match/attack?card=${pCardId}`)
        .set('WWW-authenticate', pToken);
}
function requestEndTurn(pToken) {
    return request(app)
        .get(`/match/endTurn`)
        .set('WWW-authenticate', pToken);
}

function requestFinishMatch(pToken) {
    return request(app)
        .get(`/match/finishMatch`)
        .set('WWW-authenticate', pToken);
}
function requestInitDeck(pCardIds, pToken) {
    return request(app)
        .get(`/match/initDeck?deck=${JSON.stringify(pCardIds)}`)
        .set('WWW-authenticate', pToken);
}
function requestGetMatchInfo(pToken) {
    return request(app)
        .get(`/match/getMatch`)
        .set('WWW-authenticate', pToken);
}
function requestGetAllMatches(pToken) {
    return request(app)
        .get(`/match/getAllMatch`)
        .set('WWW-authenticate', pToken);
}

module.exports = {
    requestEntry,
    requestCards,
    requestAcceptRequest,
    requestCreateUser,
    requestDeleteUser,
    requestGetAll,
    requestLogin,
    requestLogout,
    requestParticipate,
    requestSendRequest,
    requestUnparticipate,
    requestPickCard,
    requestPlayCard,
    requestAttackPlayer,
    requestAttackCard,
    requestEndTurn,
    requestFinishMatch,
    requestInitDeck,
    requestGetMatchInfo,
    requestGetAllMatches
};