const { setupDb, time } = require("./common");
const { requestEntry, requestCards } = require("./requests.js");
setupDb();

describe("Test the root path", () => {
    test("It should response the GET method", async done => {
        let response = await requestEntry()
        expect(response.statusCode).toBe(200);

        done();
    });

    test("get cards", async done => {
        let response = await requestCards();
        expect(response.statusCode).toBe(200);
        done();
    }, time);
});