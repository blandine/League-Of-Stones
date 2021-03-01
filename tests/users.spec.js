const app = require("../src/app.js");
const request = require("supertest");
const { MongoDBConnection } = require("../src/utils/database.js");
const { deleteAccount, createAccount, login } = require("../src/services/usersService.js");
const { SingleStore } = require("../src/utils/session.js");
const { response } = require("express");
const time = 10000000;
const user = {
  email: 'cat@cat.com',
  name: 'Cat',
  password: "C4t"
}
const userbis = {
  email: 'cat2@cat.com',
  name: 'Cat2',
  password: "C4t2"
}
const user1 = {
  email: 'foxy@cat.com',
  name: 'Foxy',
  password: "f0xY"
}
const user2 = {
  email: 'nell@cat.com',
  name: 'Nell',
  password: "n3lL"
}

async function requestLogin(pUser) {
  return request(app)
    .post("/login")
    .send({ email: pUser.email, password: pUser.password })
}
async function requestLogout(pToken) {
  return await request(app)
    .post("/logout")
    .set('WWW-authenticate', pToken)
}
async function requestParticipate(pToken) {
  return request(app)
    .get("/matchmaking/participate")
    .set('WWW-authenticate', pToken);
}
async function requestUnparticipate(pToken) {
  return request(app)
    .get("/matchmaking/unparticipate")
    .set('WWW-authenticate', pToken);
}

async function requestGetAll(pToken) {
  return request(app)
    .get("/matchmaking/getAll")
    .set('WWW-authenticate', pToken);
}
async function requestSendRequest(pToken, pRequestedId) {
  return request(app)
    .get("/matchmaking/request?matchmakingId=" + pRequestedId)
    .set('WWW-authenticate', pToken);
}


async function requestAcceptRequest(pToken, pRequestedId) {
  return request(app)
    .get("/matchmaking/acceptRequest?matchmakingId=" + pRequestedId)
    .set('WWW-authenticate', pToken);
}
async function requestCreateUser(pUser) {
  return request(app)
  .put("/user")
  .send({ name: user.name, email: user.email, password: user.password })
}
async function requestDeleteUser(pUser,pToken) {
  return request(app)
  .get(`/users/unsubscribe?email=${pUser.email}&password=${pUser.password}`)
  .set('WWW-authenticate', pToken);
}

describe("Test the root path up", () => {
  beforeAll(async (done) => {
    // Connect to a Mongo DB
    try {
      await MongoDBConnection.connect();
    } catch (error) {
      console.log("HEYYYYY")
    }
    done();
  })
  afterAll(async (done) => {
    return MongoDBConnection.close((err, res) => {
      console.log("hey")
    });
  })
  describe("Test the root path", () => {


    test("It should response the GET method", async done => {
      let response = await request(app)
        .get("/")
      expect(response.statusCode).toBe(200);

      done();
    });

    test("get cards", async done => {
      let response = await request(app)
        .get("/cards")
      expect(response.statusCode).toBe(200);

      response = await request(app)
        .get("/resetServer")
      await request(app)
        .get("/cards")
      expect(response.statusCode).toBe(200);
      done();
    },time);
  });

  describe("Test the insertion of an already existing user", () => {
    beforeAll(async (done) => {
      // Connect to a Mongo DB
      await createAccount(userbis.email, userbis.password,userbis.name);
      done();

    })
    afterAll(async (done) => {
      // Connect to a Mongo DB
      await deleteAccount(user.email, user.password);
      await deleteAccount(userbis.email, userbis.password);
      done();

    })
    test("It should create a new user", async done => {
      let response = await request(app)
        .put("/user")
        .send({ name: user.name, email: user.email, password: user.password })

      expect(response.statusCode).toBe(200);
      done();
    });

    test("It should not create a new user", async done => {
      let response = await request(app)
        .put("/user")
        .send({ name: userbis.name, email: userbis.email, password: userbis.password })
      expect(response.statusCode).toBe(409);
      expect(response.body.message).toBe("User already exists");
      done();

    });
  });

  describe("Test the deletion a user", () => {
    beforeAll(async (done) => {
      // Connect to a Mongo DB
      await createAccount(user.email, user.password,user.name);
      done();

    })
    
    test("Delete unlogged user", async done => {
      let response =await requestDeleteUser(user,'unvalidtoken');
      expect(response.statusCode).toBe(401);
      done();
    })
    test("It should delete a new user", async done => {
      let lislogged=await requestLogin(user);
      expect(lislogged.statusCode).toBe(200);
      let response =await requestDeleteUser(user,lislogged.body.token);
      expect(response.statusCode).toBe(200);
      let response2 =await requestDeleteUser(user,lislogged.body.token);
      expect(response2.statusCode).toBe(401);
      expect(response2.body.message).toBe("User not connected.");
      done();
    });

  });

  describe("Test the connexion", () => {
    beforeAll(async (done) => {
      // Connect to a Mongo DB
      await createAccount(user.email, user.password, user.name);
      done();

    })
    afterAll(async (done) => {
      // Connect to a Mongo DB
      await deleteAccount(user.email, user.password);
      done();
    })

    test("Login existing user", async done => {
      let response = await requestLogin(user);
      expect(response.statusCode).toBe(200);
      done();

    });
  });
  describe("Test the deconnexion", () => {
    beforeAll(async (done) => {
      // Connect to a Mongo DB
      await createAccount(user.email, user.password, user.name);
      done();

    })
    afterAll(async (done) => {
      // Connect to a Mongo DB
      await deleteAccount(user.email, user.password);
      done();
    })

    test("Logout existing user", async done => {
      let response = await requestLogin(user)
      expect(response.statusCode).toBe(200);
      expect(typeof response.body.token).toBe("string")
      let responseLogout = await request(app)
        .post("/logout")
        .set('WWW-authenticate', response.body.token)
      expect(responseLogout.statusCode).toBe(200);
      done();
    });


  });
  describe("matchmaking", () => {
    let lUserInfo;
    let lUserInfo2;
    beforeAll(async (done) => {
      // Connect to a Mongo DB
      await createAccount(user1.email, user1.password, user1.name);

      await createAccount(user2.email, user2.password, user2.name);
      done();

    })

    afterAll(async (done) => {
      // Connect to a Mongo DB
      let logout = (await requestLogout(lUserInfo.token));
      logout = (await requestLogout(lUserInfo2.token));
      done();
    })
    describe("Test the participate", () => {

      test("participate without loging", async done => {
        lUserInfo = (await requestLogin(user1)).body;
        let logout = (await requestLogout(lUserInfo.token));

        let response = await requestParticipate(lUserInfo.token);
        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe("User not connected.");
        done();
      }, time);

      test("participate existing user", async done => {
        lUserInfo = (await requestLogin(user1)).body;
        let response = await requestParticipate(lUserInfo.token);
        expect(response.statusCode).toBe(200);
        expect(typeof response.body.matchmakingId).toBe("string");
        expect(response.body.request).toHaveLength(0);
        done();
      });

      test("participate twice existing user", async done => {
        lUserInfo = (await requestLogin(user1)).body;
        let response = await requestParticipate(lUserInfo.token);
        expect(response.statusCode).toBe(200);
        const lMMId1 = response.body.matchmakingId;
        let response1 = await requestParticipate(lUserInfo.token);
        expect(response1.statusCode).toBe(200);
        let lMMId2 = response1.body.matchmakingId;
        expect(lMMId1).toEqual(lMMId2);
        done();
      });

      test("participate other user", async done => {
        lUserInfo = (await requestLogin(user1)).body;
        lUserInfo2 = (await requestLogin(user2)).body;
        let response = await requestParticipate(lUserInfo.token);
        const lMMId1 = response.body.matchmakingId;
        let response1 = await requestParticipate(lUserInfo2.token);
        expect(response1.statusCode).toBe(200);
        let lMMId2 = response1.body.matchmakingId;
        expect(lMMId1).not.toEqual(lMMId2);
        done();
      });

    })
    describe("send request", () => {
      beforeAll(async (done) => {

        lUserInfo = (await requestLogin(user1)).body;
        lUserInfo2 = (await requestLogin(user2)).body;
        done();

      })

      afterAll(async (done) => {
        const logoutRes = (await requestLogout(lUserInfo.token));
        const logoutRes2 = (await requestLogout(lUserInfo2.token));
        done();
      })
      test("request other user", async done => {
        let lMMId1 = (await requestParticipate(lUserInfo.token)).body.matchmakingId;
        let lMMId2 = (await requestParticipate(lUserInfo2.token)).body.matchmakingId;

        const lRes = (await requestSendRequest(lUserInfo.token, lMMId2));
        expect(lRes.statusCode).toEqual(200)

        expect(lRes.body.message).toContain("sent")

        let lMMRequests2 = (await requestParticipate(lUserInfo2.token)).body.request;
        expect(lMMRequests2).toHaveLength(1);

        const lResbis = (await requestSendRequest(lUserInfo.token, lMMId2)).body;
        expect(lRes.statusCode).toEqual(200)

        let lMMRequests2bis = (await requestParticipate(lUserInfo2.token)).body.request;
        expect(lMMRequests2bis).toHaveLength(1);

        done();
      }, time);

      test("send request without participating", async done => {
        let response1 = await requestParticipate(lUserInfo2.token);
        const lMMId2 = response1.body.matchmakingId;

        let response2 = await requestUnparticipate(lUserInfo.token);
        expect(response2.statusCode).toEqual(200)

        const lRes = (await requestSendRequest(lUserInfo.token, lMMId2));
        expect(lRes.body.message).toEqual("Matchmaking is undefined. Participate to have one!")
        expect(lRes.statusCode).toEqual(400)

        done();
      });

      test("send request to disconnected user", async done => {
        let response1 = await requestParticipate(lUserInfo.token);
        const lMMId1 = response1.body.matchmakingId;
        let response2 = await requestParticipate(lUserInfo2.token);
        const lMMId2 = response2.body.matchmakingId;

        const logoutRes = (await requestLogout(lUserInfo2.token));
        expect(logoutRes.statusCode).toEqual(200)

        const lRes = (await requestSendRequest(lUserInfo.token, lMMId2));
        expect(lRes.statusCode).toEqual(404);
        done();
      });
   
    });
    describe("unparticipate", () => {
      let lMMId1;
      let lMMId2;
      beforeAll(async (done) => {

        lUserInfo = (await requestLogin(user1)).body;
        lUserInfo2 = (await requestLogin(user2)).body;
        done();

      })
      beforeEach(async (done) => {

        lMMId1 = (await requestParticipate(lUserInfo.token)).body.matchmakingId;
        lMMId2 = (await requestParticipate(lUserInfo2.token)).body.matchmakingId;
        done();

      })
      afterAll(async (done) => {
        const logoutRes = (await requestLogout(lUserInfo.token));
        const logoutRes2 = (await requestLogout(lUserInfo2.token));
        done();
      })
      test("unparticipate", async done => {
        let response1 = await requestUnparticipate(lUserInfo.token);
        expect(response1.statusCode).toEqual(200)

        let response2 = await requestUnparticipate(lUserInfo.token);
        expect(response2.statusCode).toEqual(400)
        expect(response2.body.message).toBe("Matchmaking is undefined. Participate to have one!")

        let response3 = await requestParticipate(lUserInfo.token);
        expect(response3.statusCode).toEqual(200)

        let response3b = (await requestSendRequest(lUserInfo2.token, lMMId1));
        expect(response3b.statusCode).toEqual(404)

        let response4 = await requestUnparticipate(lUserInfo.token);
        expect(response4.statusCode).toEqual(200)
        let response4b = await requestAcceptRequest(lUserInfo.token);
        expect(response4b.statusCode).toEqual(400)
        expect(response4b.body.message).toBe("Matchmaking is undefined. Participate to have one!")

        let response5 = (await requestSendRequest(lUserInfo.token, lMMId2));
        expect(response5.statusCode).toEqual(400)
        expect(response5.body.message).toBe("Matchmaking is undefined. Participate to have one!")

        done();
      });
      test("getall", async done => {
        let response0 = await requestGetAll(lUserInfo.token);
        expect(response0.statusCode).toEqual(200);
        expect(response0.body).toHaveLength(1);

        let response1 = await requestUnparticipate(lUserInfo.token);
        expect(response1.statusCode).toEqual(200)

        response0 = await requestGetAll(lUserInfo.token);
        expect(response0.statusCode).toEqual(200);
        expect(response0.body).toHaveLength(1);

        let response2 = await requestUnparticipate(lUserInfo2.token);
        expect(response2.statusCode).toEqual(200)

        response0 = await requestGetAll(lUserInfo.token);
        expect(response0.statusCode).toEqual(200);
        expect(response0.body).toHaveLength(0);
        done();

      }, time);

      test("acceptRequest", async done => {
        let response0 = await requestSendRequest(lUserInfo.token,lMMId2);
        expect(response0.statusCode).toEqual(200);
        let response1 = await requestAcceptRequest(lUserInfo2.token,lMMId1);
        expect(response1.statusCode).toEqual(200);
        done();

      }, time);
    })
    

  })


});