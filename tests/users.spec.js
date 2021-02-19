const app = require("../src/app.js");
const request = require("supertest");
const { MongoDBConnection } = require("../src/utils/database.js");
const { deleteAccount, createAccount, login } = require("../src/services/usersService.js");
const { SingleStore } = require("../src/utils/session.js");
const time=10000000;
const user = {
  email: 'cat@cat.com',
  name: 'Cat',
  password: "C4t"
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
async function requestSendRequest(pToken,pRequestedId) {
  return request(app)
    .get("/matchmaking/request?matchmakingId="+pRequestedId)
    .set('WWW-authenticate', pToken);
}


async function requestAcceptRequest(pToken,pRequestedId) {
  return request(app)
    .get("/matchmaking/acceptRequest?matchmakingId="+pRequestedId)
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
  });

  describe("Test the insertion of an already existing user", () => {
    afterAll(async (done) => {
      // Connect to a Mongo DB
      await deleteAccount(user.email, user.password);
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
        .send({ name: user.name, email: user.email, password: user.password })
      expect(response.statusCode).toBe(409);
      expect(response.body.message).toBe("User already exists");
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
  describe("matchmaking",()=>{
    beforeAll(async (done) => {
      // Connect to a Mongo DB
      await createAccount(user1.email, user1.password, user1.name);

      await createAccount(user2.email, user2.password, user2.name);
      done();

    })

    afterAll(async (done) => {
      // Connect to a Mongo DB
      done();
    })
    describe("Test the participate", () => {

  
      test("participate without loging", async done => {
        let lUserInfo = (await requestLogin(user1)).body;
        let logout = (await requestLogout(lUserInfo.token));
  
        let response = await requestParticipate(lUserInfo.token);
        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe("User not connected.");
        done();
      });
  
      test("participate existing user", async done => {
        let lUserInfo = (await requestLogin(user1)).body;
        let response = await requestParticipate(lUserInfo.token);
        expect(response.statusCode).toBe(200);
        expect(typeof response.body.matchmakingId).toBe("string");
        expect(response.body.request).toHaveLength(0);
        done();
      });
  
      test("participate twice existing user", async done => {
        let lUserInfo = (await requestLogin(user1)).body;
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
        let lUserInfo = (await requestLogin(user1)).body;
        let lUserInfo2 = (await requestLogin(user2)).body;
        let response = await requestParticipate(lUserInfo.token);
        const lMMId1 = response.body.matchmakingId;
        let response1 = await requestParticipate(lUserInfo2.token);
        expect(response1.statusCode).toBe(200);
        let lMMId2 = response1.body.matchmakingId;
        expect(lMMId1).not.toEqual(lMMId2);
        done();
      });
  
    })
    describe("send request",()=>{
      let lUserInfo;
      let lUserInfo2;
      beforeAll(async (done) => {
        
        lUserInfo= (await requestLogin(user1)).body;
        lUserInfo2 = (await requestLogin(user2)).body;
        done();
  
      })
  
      afterAll(async (done) => {
        // Connect to a Mongo DB
        
        const logoutRes = (await requestLogout(lUserInfo2.token));
        const logoutRes2 = (await requestLogout(lUserInfo2.token));
        done();
      })
      test("request other user", async done => {
        let lMMId1 = (await requestParticipate(lUserInfo.token)).body.matchmakingId;
        let lMMId2 = (await requestParticipate(lUserInfo2.token)).body.matchmakingId;
        
        const lRes = (await requestSendRequest(lUserInfo.token,lMMId2)).body;
        expect(lRes).toEqual({message:"Request sent"})
        
        let lMMRequests2 = (await requestParticipate(lUserInfo2.token)).body.request;
        expect(lMMRequests2).toHaveLength(1);
  
        const lResbis = (await requestSendRequest(lUserInfo.token,lMMId2)).body;
        expect(lResbis).toEqual({message:"Request sent"})
        
        let lMMRequests2bis = (await requestParticipate(lUserInfo2.token)).body.request;
        expect(lMMRequests2bis).toHaveLength(1);
  
        done();
      },time);
  
      test("send request without participating", async done => {
        let response1 = await requestParticipate(lUserInfo2.token);
        const lMMId2 = response1.body.matchmakingId;
    
        const lRes = (await requestSendRequest(lUserInfo.token,lMMId2));
        expect(lRes.body.message).toEqual("Your matchmakingId is undefined. Participate first")
        expect(lRes.statusCode).toEqual(400)
    
        done();
      });
    
      test("send request to disconected user", async done => {
        let response1 = await requestParticipate(lUserInfo1.token);
        const lMMId1 = response1.body.matchmakingId;
        let response2 = await requestParticipate(lUserInfo2.token);
        const lMMId2 = response2.body.matchmakingId;
    
         const logoutRes = (await requestLogout(lUserInfo2.token));
        const lRes = (await requestSendRequest(lUserInfo1.token,lMMId2));
        expect(lRes.statusCode).toEqual(200)
        done();
      });
    
    });
    describe("unparticipate",done=>{
      beforeAll(async (done) => {
        
        let lMMId1 = (await requestParticipate(lUserInfo.token)).body.matchmakingId;
        let lMMId2 = (await requestParticipate(lUserInfo2.token)).body.matchmakingId;
        done();
  
      })

      
    })
  })


 

});