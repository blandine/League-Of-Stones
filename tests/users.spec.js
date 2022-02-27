const app = require('../src/app.js');
const request = require('supertest');

const {
  deleteAccount,
  createAccount,
} = require('../src/services/usersService.js');
const { mocks, setupDb } = require('./common.js');
const {
  requestDeleteUser,
  requestLogin,
  requestLogout,
} = require('./requests.js');
setupDb();

describe('user', () => {
  const lUser1 = mocks.user;
  beforeEach(async (done) => {
    await createAccount(lUser1.email, lUser1.password, lUser1.name);
    done();
  });
  afterEach(async (done) => {
    // Connect to a Mongo DB
    await deleteAccount(lUser1.email, lUser1.password);
    done();
  });
  describe('Upserting a user', () => {
    const lUser2 = mocks.userbis;

    afterEach(async (done) => {
      // Connect to a Mongo DB
      await deleteAccount(lUser2.email, lUser2.password);
      done();
    });
    test('It should create a new user', async (done) => {
      let response = await request(app)
        .put('/user')
        .send({
          name: lUser2.name,
          email: lUser2.email,
          password: lUser2.password,
        });

      expect(response.statusCode).toBe(200);
      done();
    });

    test('It should not create a new user', async (done) => {
      await createAccount(lUser2.email, lUser2.password, lUser2.name);
      let response = await request(app)
        .put('/user')
        .send({
          name: lUser2.name,
          email: lUser2.email,
          password: lUser2.password,
        });
      expect(response.statusCode).toBe(409);
      expect(response.body.message).toBe('User already exists');

      await deleteAccount(lUser2.email, lUser2.password);
      done();
    });
  });

  describe('Test the deletion a user', () => {
    test('Delete unlogged user', async (done) => {
      let response = await requestDeleteUser(lUser1, 'unvalidtoken');
      expect(response.statusCode).toBe(401);
      done();
    });

    test('It should delete a logged user', async (done) => {
      let lislogged = await requestLogin(lUser1);
      expect(lislogged.statusCode).toBe(200);
      let response = await requestDeleteUser(lUser1, lislogged.body.token);
      expect(response.statusCode).toBe(200);
      let response2 = await requestDeleteUser(lUser1, lislogged.body.token);
      expect(response2.statusCode).toBe(401);
      expect(response2.body.message).toBe('User not connected.');
      done();
    });
  });

  describe('Test the login', () => {
    const lUser1 = mocks.user;

    test('Login existing user', async (done) => {
      let response = await requestLogin(lUser1);
      expect(response.statusCode).toBe(200);
      done();
    });
  });

  describe('Test the logout', () => {
    test('Logout existing user', async (done) => {
      let response = await requestLogin(lUser1);
      expect(response.statusCode).toBe(200);
      expect(typeof response.body.token).toBe('string');
      let responseLogout = await requestLogout(response.body.token);
      expect(responseLogout.statusCode).toBe(200);
      done();
    });
  });
});
