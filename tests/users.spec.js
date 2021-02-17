const app = require("../src/app.js");
const request = require("supertest");
const { MongoDBConnection } = require("../src/utils/database.js");
const { deleteAccount, createAccount } = require("../src/services/usersService.js");

const user = {
  email: 'cat@cat.com',
  name: 'Manny',
  password: "test"
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

    test("Login existing user", done => {
      return request(app)
        .post("/login")
        .send({ email: user.email, password: user.password })
        .then(response => {
          expect(response.statusCode).toBe(200);
          done();
        });
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

    test("Logout existing user",async done => {
      let response = await request(app)
        .post("/login")
        .send({ email: user.email, password: user.password })
      expect(response.statusCode).toBe(200);
      expect(typeof response.body.token).toBe("string")
      let responseLogout = await request(app)
        .post("/logout")
        .set('WWW-authenticate', response.body.token)
      expect(responseLogout.statusCode).toBe(200);
      done();
    });
  });
});