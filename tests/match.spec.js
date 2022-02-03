const { createAccount, logout } = require('../src/services/usersService');
const { mocks, setupDb } = require('./common');
const {
  requestLogin,
  requestParticipate,
  requestSendRequest,
  requestAcceptRequest,
  requestCards,
  requestInitDeck,
  requestGetMatchInfo,
} = require('./requests');
setupDb();

describe('match', () => {
  let lUserInfo;
  let lUserInfo2;
  beforeAll(async (done) => {
    // Connect to a Mongo DB
    await createAccount(
      mocks.user1.email,
      mocks.user1.password,
      mocks.user1.name
    );
    await createAccount(
      mocks.user2.email,
      mocks.user2.password,
      mocks.user2.name
    );
    let responseLoginUser1 = await requestLogin(mocks.user1);
    expect(responseLoginUser1.statusCode).toBe(200);
    lUserInfo = responseLoginUser1.body;
    let responseLoginUser2 = await requestLogin(mocks.user2);
    lUserInfo2 = responseLoginUser2.body;
    expect(responseLoginUser2.statusCode).toBe(200);

    lUserInfo.participate = (await requestParticipate(lUserInfo.token)).body;
    lUserInfo2.participate = (await requestParticipate(lUserInfo2.token)).body;
    let respSend = await requestSendRequest(
      lUserInfo.token,
      lUserInfo2.participate.matchmakingId
    );

    expect(respSend.statusCode).toBe(200);
    let respAccept = await requestAcceptRequest(
      lUserInfo2.token,
      lUserInfo.participate.matchmakingId
    );
    expect(respAccept.statusCode).toBe(200);

    let matchInfo = await requestGetMatchInfo(lUserInfo2.token);
    expect(matchInfo.statusCode).toBe(200);

    done();
  });

  afterAll(async (done) => {
    let resplogout = await logout(lUserInfo.id);
    resplogout = await logout(lUserInfo2.id);
    done();
  });

  test('init deck player 1 without 20 cards', async (done) => {
    const lResCards = await requestCards();

    //21 cards
    const lRes1 = await requestInitDeck(
      lResCards.body.slice(0, 21),
      lUserInfo.token
    );
    expect(lRes1.statusCode).toBe(400);

    //19 cards
    const lRes2 = await requestInitDeck(
      lResCards.body.slice(0, 19),
      lUserInfo.token
    );
    expect(lRes2.statusCode).toBe(400);

    //no cards
    const lRes0 = await requestInitDeck(null, lUserInfo.token);
    expect(lRes0.statusCode).toBe(400);
    done();
  });

  test('init deck player 1 with twice same card', async (done) => {
    const lResCards = await requestCards();
    const cards = [...lResCards.body.slice(0, 19), lResCards.body[0]];
    const lRes1 = await requestInitDeck(cards, lUserInfo.token);
    expect(lRes1.statusCode).toBe(400);
    done();
  });

  test('init deck player 1 with an unknown card', async (done) => {
    const lResCards = await requestCards();
    const badCard = { ...lResCards.body[0] };
    badCard.key = -1;
    const cards = [...lResCards.body.slice(0, 19), badCard];
    const lRes1 = await requestInitDeck(cards, lUserInfo.token);
    expect(lRes1.statusCode).toBe(400);
    done();
  });

  test('init deck player with 20 cards', async (done) => {
    const lResCards = await requestCards();
    const cards = [...lResCards.body.slice(0, 20)];
    const lRes1 = await requestInitDeck(cards, lUserInfo.token);
    expect(lRes1.statusCode).toBe(200);
    expect(lRes1.body.deck).toEqual('initialized');
    done();
  });

  test('deck is already defined', async (done) => {
    const lResCards = await requestCards();
    const cards = [...lResCards.body.slice(0, 20)];
    await requestInitDeck(cards, lUserInfo.token);
    const lRes2 = await requestInitDeck(cards, lUserInfo.token);
    expect(lRes2.statusCode).toBe(400);
    done();
  });

  test('two decks are ok', async (done) => {
    const lResCards = await requestCards();
    const cards = [...lResCards.body.slice(0, 20)];
    
    await requestInitDeck(cards, lUserInfo.token);

    let matchInfo2 = await requestGetMatchInfo(lUserInfo2.token);
    expect(matchInfo2.statusCode).toBe(200);

    await requestInitDeck(cards, lUserInfo2.token);
    
    matchInfo2 = await requestGetMatchInfo(lUserInfo2.token);
    expect(matchInfo2.statusCode).toBe(200);
    expect(matchInfo2.status).toEqual('Turn : player 1');
    done();
  });
});
