const app = require("../src/app.js");
const request = require("supertest");

const { deleteAccount, createAccount } = require("../src/services/usersService.js");
const { 
  requestDeleteUser,
  requestLogin,
  mocks
 } = require("./common.js");

const {setupDb,time} = require("./main")
setupDb();


  describe("Test the insertion of an already existing user", () => {
    beforeAll(async (done) => {
      // Connect to a Mongo DB
      await createAccount(mocks.userbis.email, mocks.userbis.password, mocks.userbis.name);
      done();

    })
    afterAll(async (done) => {
      // Connect to a Mongo DB
      await deleteAccount(mocks.user.email, mocks.user.password);
      await deleteAccount(mocks.userbis.email, mocks.userbis.password);
      done();

    })
    test("It should create a new user", async done => {
      let response = await request(app)
        .put("/user")
        .send({ name: mocks.user.name, email: mocks.user.email, password: mocks.user.password })

      expect(response.statusCode).toBe(200);
      done();
    });

    test("It should not create a new user", async done => {
      let response = await request(app)
        .put("/user")
        .send({ name: mocks.userbis.name, email: mocks.userbis.email, password: mocks.userbis.password })
      expect(response.statusCode).toBe(409);
      expect(response.body.message).toBe("User already exists");
      done();

    });
  });

  describe("Test the deletion a user", () => {
    beforeAll(async (done) => {
      // Connect to a Mongo DB
      await createAccount(mocks.user.email, mocks.user.password, mocks.user.name);
      done();

    })

    test("Delete unlogged user", async done => {
      let response = await requestDeleteUser(mocks.user, 'unvalidtoken');
      expect(response.statusCode).toBe(401);
      done();
    })
    test("It should delete a new user", async done => {
      let lislogged = await requestLogin(mocks.user);
      expect(lislogged.statusCode).toBe(200);
      let response = await requestDeleteUser(mocks.user, lislogged.body.token);
      expect(response.statusCode).toBe(200);
      let response2 = await requestDeleteUser(mocks.user, lislogged.body.token);
      expect(response2.statusCode).toBe(401);
      expect(response2.body.message).toBe("User not connected.");
      done();
    });

  });

  describe("Test the connexion", () => {
    beforeAll(async (done) => {
      // Connect to a Mongo DB
      await createAccount(mocks.user.email, mocks.user.password, mocks.user.name);
      done();

    })
    afterAll(async (done) => {
      // Connect to a Mongo DB
      await deleteAccount(mocks.user.email, mocks.user.password);
      done();
    })

    test("Login existing user", async done => {
      let response = await requestLogin(mocks.user);
      expect(response.statusCode).toBe(200);
      done();

    });
  });
  describe("Test the deconnexion", () => {
    beforeAll(async (done) => {
      // Connect to a Mongo DB
      await createAccount(mocks.user.email, mocks.user.password, mocks.user.name);
      done();

    })
    afterAll(async (done) => {
      // Connect to a Mongo DB
      await deleteAccount(mocks.user.email, mocks.user.password);
      done();
    })

    test("Logout existing user", async done => {
      let response = await requestLogin(mocks.user)
      expect(response.statusCode).toBe(200);
      expect(typeof response.body.token).toBe("string")
      let responseLogout = await request(app)
        .post("/logout")
        .set('WWW-authenticate', response.body.token)
      expect(responseLogout.statusCode).toBe(200);
      done();
    });


  });


