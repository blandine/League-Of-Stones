const { createAccount } = require("../src/services/usersService.js");
const {
    requestAcceptRequest,
    requestGetAll,
    requestLogout,
    requestParticipate,
    requestSendRequest,
    requestUnparticipate,
    requestLogin,
    
    mocks
} = require("./common.js");
const { setupDb, time } = require("./main");

setupDb();

describe("matchmaking", () => {
    let lUserInfo;
    let lUserInfo2;
    beforeAll(async (done) => {
        // Connect to a Mongo DB
        await createAccount(mocks.user1.email, mocks.user1.password, mocks.user1.name);

        await createAccount(mocks.user2.email, mocks.user2.password, mocks.user2.name);
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
            lUserInfo = (await requestLogin(mocks.user1)).body;
            let logout = (await requestLogout(lUserInfo.token));

            let response = await requestParticipate(lUserInfo.token);
            expect(response.statusCode).toBe(401);
            expect(response.body.message).toBe("User not connected.");
            done();
        }, time);

        test("participate existing user", async done => {
            lUserInfo = (await requestLogin(mocks.user1)).body;
            let response = await requestParticipate(lUserInfo.token);
            expect(response.statusCode).toBe(200);
            expect(typeof response.body.matchmakingId).toBe("string");
            expect(response.body.request).toHaveLength(0);
            done();
        });

        test("participate twice existing user", async done => {
            lUserInfo = (await requestLogin(mocks.user1)).body;
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
            lUserInfo = (await requestLogin(mocks.user1)).body;
            lUserInfo2 = (await requestLogin(mocks.user2)).body;
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

            lUserInfo = (await requestLogin(mocks.user1)).body;
            lUserInfo2 = (await requestLogin(mocks.user2)).body;
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

            lUserInfo = (await requestLogin(mocks.user1)).body;
            lUserInfo2 = (await requestLogin(mocks.user2)).body;
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
            let response0 = await requestSendRequest(lUserInfo.token, lMMId2);
            expect(response0.statusCode).toEqual(200);
            let response1 = await requestAcceptRequest(lUserInfo2.token, lMMId1);
            expect(response1.statusCode).toEqual(200);
            done();

        }, time);
    })

})