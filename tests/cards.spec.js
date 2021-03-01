const app = require("../src/app.js");
const request = require("supertest");

const { setupDb, time } = require ("./main");
setupDb();

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
        done();
    }, time);
});