const app = require("../src/app.js");
const request = require("supertest");

const user = {
    email: 'cat@cat.com',
    name: 'Cat',
    password: 'C4t',
  };
  const userbis = {
    email: 'cat2@cat.com',
    name: 'Cat2',
    password: 'C4t2',
  };
  const user1 = {
    email: 'foxy@cat.com',
    name: 'Foxy',
    password: 'f0xY',
  };
  const user2 = {
    email: 'nell@cat.com',
    name: 'Nell',
    password: 'n3lL',
  };
async function requestLogin(pUser) {
    return request(app)
        .post('/login')
        .send({ email: pUser.email, password: pUser.password });
}
async function requestLogout(pToken) {
    return await request(app).post('/logout').set('WWW-authenticate', pToken);
}
async function requestParticipate(pToken) {
    return request(app)
        .get('/matchmaking/participate')
        .set('WWW-authenticate', pToken);
}
async function requestUnparticipate(pToken) {
    return request(app)
        .get('/matchmaking/unparticipate')
        .set('WWW-authenticate', pToken);
}

async function requestGetAll(pToken) {
    return request(app)
        .get('/matchmaking/getAll')
        .set('WWW-authenticate', pToken);
}
async function requestSendRequest(pToken, pRequestedId) {
    return request(app)
        .get('/matchmaking/request?matchmakingId=' + pRequestedId)
        .set('WWW-authenticate', pToken);
}

async function requestAcceptRequest(pToken, pRequestedId) {
    return request(app)
        .get('/matchmaking/acceptRequest?matchmakingId=' + pRequestedId)
        .set('WWW-authenticate', pToken);
}
async function requestCreateUser(pUser) {
    return request(app)
        .put('/user')
        .send({ name: user.name, email: user.email, password: user.password });
}
async function requestDeleteUser(pUser, pToken) {
    return request(app)
        .get(`/users/unsubscribe?email=${pUser.email}&password=${pUser.password}`)
        .set('WWW-authenticate', pToken);
}

module.exports = {
    mocks:{
        user,
        userbis,
        user1,
        user2
    },
    requestAcceptRequest,
    requestCreateUser,
    requestDeleteUser,
    requestGetAll,
    requestLogin,
    requestLogout,
    requestParticipate,
    requestSendRequest,
    requestUnparticipate,
};
