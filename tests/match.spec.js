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
  requestPlayCard,
  requestPickCard,
  requestAttackPlayer,
  requestAttackCard,
  requestEndTurn,
  requestFinishMatch,
} = require('./requests');
setupDb();

const initGame = async (user1, user2) => {
  let responseLoginUser1 = await requestLogin(user1);
  const lUserInfo = responseLoginUser1.body;
  let responseLoginUser2 = await requestLogin(user2);
  const lUserInfo2 = responseLoginUser2.body;

  lUserInfo.participate = (await requestParticipate(lUserInfo.token)).body;
  lUserInfo2.participate = (await requestParticipate(lUserInfo2.token)).body;
  await requestSendRequest(
    lUserInfo.token,
    lUserInfo2.participate.matchmakingId
  );

  await requestAcceptRequest(
    lUserInfo2.token,
    lUserInfo.participate.matchmakingId
  );

  let matchInfo = await requestGetMatchInfo(lUserInfo2.token);

  return { userInfo1: lUserInfo, userInfo2: lUserInfo2, matchInfo };
};
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
    done();
  });

  beforeEach(async (done) => {
    const { userInfo1, userInfo2, matchInfo } = await initGame(
      mocks.user1,
      mocks.user2
    );
    lUserInfo = userInfo1;
    lUserInfo2 = userInfo2;
    expect(matchInfo.statusCode).toBe(200);
    done();
  });

  afterEach(async (done) => {
    if (lUserInfo?.id) {
      await logout(lUserInfo.id);
    }
    if (lUserInfo2?.id) {
      await logout(lUserInfo2.id);
    }
    done();
  });

  describe('init deck', () => {
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
      expect(matchInfo2.body.status).toEqual('Turn : player 1');
      done();
    });
  });

  describe('start playing', () => {
    let lResCards;

    beforeAll(async (done) => {
      lResCards = await requestCards();
      done();
    });

    beforeEach(async (done) => {
      const cards = [...lResCards.body.slice(0, 20)];
      await requestInitDeck(cards, lUserInfo.token);
      await requestInitDeck(cards, lUserInfo2.token);
      done();
    });
   
    describe('Match needs to be initialized',()=>{
      test('Attack Card', async (done) => {
        const { statusCode, body } = await requestAttackCard(
          'test',
          'test',
          lUserInfo.token
        );
        expect(statusCode).toBe(400);
        expect(body.message).toBe('Match needs to be initialized first');
        done();
      });

      test('end turn', async (done) => {
        const response = await requestEndTurn(lUserInfo.token);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe('Match needs to be initialized first');
        done();
      });

      test('Play Card', async (done) => {
        const {statusCode,body} = await requestPlayCard('test', lUserInfo2.token);
        expect(statusCode).toBe(400);
        expect(body.message).toBe('Match needs to be initialized first');
        done();
      });

      test('pick card', async (done) => {
        const {statusCode,body} = await requestPickCard(lUserInfo.token);
        expect(statusCode).toBe(400);
        expect(body.message).toBe('Match needs to be initialized first');
        done();
      });
    })

    describe('match is initialized',()=>{
      describe('playing a card', () => {
        test('missing card param', async (done) => {
          const {statusCode,body} = await requestPlayCard(undefined, lUserInfo2.token);
          expect(statusCode).toBe(400);
          expect(body.message).toBe('card query parameter is missing');
          done();
        });
  
         
        test('player 2 try to play before her turn', async (done) => {
          matchInfo2 = await requestGetMatchInfo(lUserInfo2.token);
          expect(matchInfo2.body.status).toEqual('Turn : player 1');
          const card = matchInfo2.body.player2.hand[0];
          const response = await requestPlayCard(card.key, lUserInfo2.token);
          expect(response.statusCode).toBe(400);
          expect(response.body.message).toEqual('Not your turn');
          done();
        });
        test('player 1 try to play an unknown card', async (done) => {
          matchInfo1 = await requestGetMatchInfo(lUserInfo.token);
          expect(matchInfo1.body.status).toEqual('Turn : player 1');
          const cardKey = 'TEST';
          const response = await requestPlayCard(cardKey, lUserInfo.token);
          expect(response.statusCode).toBe(400);
          expect(response.body.message).toEqual('Card is not in the hand');
          done();
        });
  
        test('player 1 plays her first valid card', async (done) => {
          matchInfo1 = await requestGetMatchInfo(lUserInfo.token);
          expect(matchInfo1.body.status).toEqual('Turn : player 1');
          const cardKey = matchInfo1.body.player1.hand[0].key;
          const response = await requestPlayCard(cardKey, lUserInfo.token);
          expect(response.statusCode).toBe(200);
          matchInfo1 = await requestGetMatchInfo(lUserInfo.token);
          expect(matchInfo1.body.status).toEqual('Turn : player 1');
          done();
        });
      });
      describe('picking a card', () => {
        test('player 1 can pick only one card', async (done) => {
          matchInfo1 = await requestGetMatchInfo(lUserInfo.token);
          expect(matchInfo1.body.status).toEqual('Turn : player 1');
          expect(matchInfo1.body.player1.hand.length).toBe(4);
  
          const response = await requestPickCard(lUserInfo.token);
          expect(response.statusCode).toBe(200);
          matchInfo1 = await requestGetMatchInfo(lUserInfo.token);
          expect(matchInfo1.body.player1.hand.length).toBe(5);
  
          const response2 = await requestPickCard(lUserInfo.token);
          expect(response2.statusCode).toBe(400);
  
          matchInfo1 = await requestGetMatchInfo(lUserInfo.token);
          expect(matchInfo1.body.player1.hand.length).toBe(5);
          done();
        });
      });

      describe('Attack player', () => {
        test("Needs card params", async (done) => {
          matchInfo1 = await requestGetMatchInfo(lUserInfo.token);
          expect(matchInfo1.body.status).toEqual('Turn : player 1');
          const { statusCode, body } = await requestAttackPlayer(
            null,
            lUserInfo.token
          );
          expect(statusCode).toBe(400);
          expect(body.message).toBe("card query parameter is missing");
          done();
        });
  
        test("Player's card is not on the board", async (done) => {
          matchInfo1 = await requestGetMatchInfo(lUserInfo.token);
          expect(matchInfo1.body.status).toEqual('Turn : player 1');
          let cardKey = 'test';
          const { statusCode, body } = await requestAttackPlayer(
            cardKey,
            lUserInfo.token
          );
          expect(statusCode).toBe(400);
          expect(body.message).toBe("Player's card is not on the board");
          done();
        });
      });

      describe('attack card', () => {
        test('missing card param', async (done) => {
          matchInfo1 = await requestGetMatchInfo(lUserInfo.token);
          const { statusCode, body } = await requestAttackCard(
            undefined,
            'test',
            lUserInfo.token
          );
          expect(statusCode).toBe(400);
          expect(body.message).toBe('card query parameter is missing');
          done();
        });
        test('missing enemyCard params', async (done) => {
          const { statusCode, body } = await requestAttackCard(
            'test',
            undefined,
            lUserInfo.token
          );
          expect(statusCode).toBe(400);
          expect(body.message).toBe('ennemyCard query parameter is missing');
          done();
        });
  
  
  
        describe('after 1 turn ...', () => {
          beforeEach(async (done) => {
            //j1 plays 1 card
            let cardKey;
            matchInfo1 = await requestGetMatchInfo(lUserInfo.token);
            expect(matchInfo1.body.status).toEqual('Turn : player 1');
            cardKey = matchInfo1.body.player1.hand[0].key;
            await requestPlayCard(cardKey, lUserInfo.token);
            const res= await requestEndTurn(lUserInfo.token)
            //j2 plays
            matchInfo2 = await requestGetMatchInfo(lUserInfo2.token);
              
            expect(matchInfo2.body.status).toEqual('Turn : player 2');
            cardKey = matchInfo2.body.player2.hand[0].key;
            await requestPlayCard(cardKey, lUserInfo2.token);
            await requestEndTurn(lUserInfo2.token)
            matchInfo2 = await requestGetMatchInfo(lUserInfo2.token);
            
            expect(matchInfo2.body.status).toEqual('Turn : player 1');
            done();
          });
  
          test('bad value for enemycard', async (done) => {
            matchInfo1 = await requestGetMatchInfo(lUserInfo.token);
            expect(matchInfo1.body.status).toEqual('Turn : player 1');
            const cardKey = matchInfo1.body.player1.board[0].key;
            const { statusCode, body } = await requestAttackCard(
              cardKey,
              'test',
              lUserInfo.token
            );
            expect(statusCode).toBe(400);
            expect(body.message).toBe("Ennemy's card is not on the board");
            done();
          });
          test('Player card is not on the board', async (done) => {
            matchInfo1 = await requestGetMatchInfo(lUserInfo.token);
            expect(matchInfo1.body.status).toEqual('Turn : player 1');
            const cardKey = matchInfo1.body.player1.hand[0].key;
            const ennemyCardKey = matchInfo1.body.player2.board[0].key;
            const { statusCode, body } = await requestAttackCard(
              cardKey,
              ennemyCardKey,
              lUserInfo.token
            );
            expect(statusCode).toBe(400);
            expect(body.message).toBe("Player's card is not on the board");
            done();
          });

          test('Player card on the board attack ennemy card on the board', async (done) => {
            matchInfo1 = await requestGetMatchInfo(lUserInfo.token);
            expect(matchInfo1.body.status).toEqual('Turn : player 1');
            const cardKey = matchInfo1.body.player1.board[0].key;
            const ennemyCardKey = matchInfo1.body.player2.board[0].key;
            const { statusCode } = await requestAttackCard(
              cardKey,
              ennemyCardKey,
              lUserInfo.token
            );
            expect(statusCode).toBe(200);
            done();
          });
        });
  
      });
    })
    
  });
});

describe('end turn', () => {
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
    done();
  });

  beforeEach(async (done) => {
    const { userInfo1, userInfo2, matchInfo } = await initGame(
      mocks.user1,
      mocks.user2
    );
    lUserInfo = userInfo1;
    lUserInfo2 = userInfo2;
    expect(matchInfo.statusCode).toBe(200);
    done();
  });

  afterEach(async (done) => {
    if (lUserInfo?.id) {
      await logout(lUserInfo.id);
    }
    if (lUserInfo2?.id) {
      await logout(lUserInfo2.id);
    }
    done();
  });

  let lResCards;

  beforeAll(async (done) => {
    lResCards = await requestCards();
    done();
  });

  beforeEach(async (done) => {
    const cards = [...lResCards.body.slice(0, 20)];
    await requestInitDeck(cards, lUserInfo.token);
    await requestInitDeck(cards, lUserInfo2.token);
    done();
  });
  test('player 1 ends turn', async (done) => {
    matchInfo1 = await requestGetMatchInfo(lUserInfo.token);
    expect(matchInfo1.body.status).toEqual('Turn : player 1');

    const response = await requestEndTurn(lUserInfo.token);
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('End of turn player1');
    matchInfo1 = await requestGetMatchInfo(lUserInfo.token);
    expect(matchInfo1.body.status).toEqual('Turn : player 2');

    matchInfo2 = await requestGetMatchInfo(lUserInfo2.token);
    expect(matchInfo2.body.status).toEqual('Turn : player 2');

    let response2 = await requestEndTurn(lUserInfo2.token);
    expect(response2.statusCode).toBe(200);
    expect(response2.body.message).toBe('End of turn player2');

    matchInfo1 = await requestGetMatchInfo(lUserInfo.token);
    expect(matchInfo1.body.status).toEqual('Turn : player 1');
    matchInfo2 = await requestGetMatchInfo(lUserInfo2.token);
    expect(matchInfo2.body.status).toEqual('Turn : player 1');
    done();
  });
});

describe('finish match',()=>{
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
    done();
  });

  beforeEach(async (done) => {
    const { userInfo1, userInfo2, matchInfo } = await initGame(
      mocks.user1,
      mocks.user2
    );
    lUserInfo = userInfo1;
    lUserInfo2 = userInfo2;
    expect(matchInfo.statusCode).toBe(200);
    done();
  });

  afterEach(async (done) => {
    if (lUserInfo?.id) {
      await logout(lUserInfo.id);
    }
    if (lUserInfo2?.id) {
      await logout(lUserInfo2.id);
    }
    done();
  });

  let lResCards;

  beforeAll(async (done) => {
    lResCards = await requestCards();
    done();
  });

  beforeEach(async (done) => {
    const cards = [...lResCards.body.slice(0, 20)];
    await requestInitDeck(cards, lUserInfo.token);
    await requestInitDeck(cards, lUserInfo2.token);
    done();
  });
  test('finish match',async (done)=>{
    let card;
    matchInfo1 = await requestGetMatchInfo(lUserInfo.token);
    await requestPickCard(lUserInfo.token);
    await requestEndTurn(lUserInfo.token)

    matchInfo2 = await requestGetMatchInfo(lUserInfo2.token);
    await requestEndTurn(lUserInfo2.token)
    
    matchInfo1 = await requestGetMatchInfo(lUserInfo.token);
    card = matchInfo1.body.player1.hand[0];
    await requestPlayCard(card.key, lUserInfo.token);
    await requestPickCard(lUserInfo.token);
    await requestEndTurn(lUserInfo.token)

    matchInfo2 = await requestGetMatchInfo(lUserInfo2.token);
    await requestEndTurn(lUserInfo2.token)
    
    const {statusCode, body} = await requestFinishMatch(lUserInfo2.token)
    expect(statusCode).toBe(400)
    expect(body.message).toEqual('Match is not finished')
    let matchInfo;
    do{
      matchInfo1 = await requestGetMatchInfo(lUserInfo.token);
      if(matchInfo1.body.player1.hand.length){
        card = matchInfo1.body.player1.hand[0].key;
        await requestPlayCard(card, lUserInfo.token);
      }
      await requestPickCard(lUserInfo.token);
      if(matchInfo1.body.player1.board.length){
        cardA = matchInfo1.body.player1.board[0].key;
        await requestAttackPlayer(cardA, lUserInfo.token);
      }
      await requestEndTurn(lUserInfo.token)
        
      matchInfo2 = await requestGetMatchInfo(lUserInfo2.token);
      await requestEndTurn(lUserInfo2.token)

      matchInfo = await requestGetMatchInfo(lUserInfo.token);
      expect(matchInfo.body.player2.hp).toBeLessThanOrEqual(matchInfo1.body.player2.hp)
    }while(matchInfo.body.player2.hp>0)
   
    await requestFinishMatch(lUserInfo2.token)
    expect(matchInfo.body.status).toEqual('Player player1 won')
    expect(matchInfo.body.player2.hp).toBeLessThanOrEqual(0)
    
   
    done()
  },100000)
})