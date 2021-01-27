const request = require("supertest");
const app = require("../src/app.js");
describe("Test the root path", () => {
    test("It should response the GET method", done => {
      request(app)
        .get("/")
        .then(response => {
          expect(response.statusCode).toBe(200);
          done();
        });
    });
  });

  describe("Test the non protected users path", () => {
    test("It should create a new user", done => {
      request(app)
        .put("/user")
        
        .send({ name: 'Manny', email: 'cat@cat.com',password:"test" })
        .then(response => {
          console.log(response.body)
          expect(response.statusCode).toBe(400);//wip
          done();
        });
    });
  });