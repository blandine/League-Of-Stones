module.exports = {
  init: function(app, tools, losDB, cards) {
    var ObjectId = require('mongodb').ObjectID;

    app.get('/match/getMatch', function(req, res) {
      var sess = req.session;
      if (sess && sess.connectedUser) {
        losDB.collection('Match').findOne(
          {
            $or: [
              { 'player1.id': sess.connectedUser._id },
              { 'player2.id': sess.connectedUser._id }
            ]
          },
          function(err, result) {
            if (err != null || !result) {
              tools.sendError(res, 'There is no match associated');
            } else {
              if (!result.status) {
                result.status = 'Deck is pending';
                losDB
                  .collection('Match')
                  .update(
                    { _id: new ObjectId(result._id) },
                    { $set: { status: result.status } }
                  );
              } else {
                if (
                  result.player1.board === undefined &&
                  (result.player1.deck !== undefined &&
                    result.player1.deck !== null &&
                    result.player1.deck.length > 0) &&
                  (result.player2.deck !== undefined &&
                    result.player2.deck !== null &&
                    result.player2.deck.length > 0)
                ) {
                  result.status = 'Turn : player 1';
                  result.player1.hp = 150; // INIT health point for each player
                  result.player2.hp = 150;
                  result.player1.hand = result.player1.deck.splice(0, 4);
                  result.player2.hand = result.player2.deck.splice(0, 4);
                  result.player1.board = [];
                  result.player2.board = [];
                  result.player1.turn = true;
                  result.player1.cardPicked = false;
                  result.player2.turn = false;
                  result.player2.cardPicked = false;
                  losDB
                    .collection('Match')
                    .update({ _id: new ObjectId(result._id) }, result);
                }
                if (result.player1.id == sess.connectedUser._id) {
                  if (result.player2.hand)
                    result.player2.hand = result.player2.hand.length;
                } else {
                  if (result.player1.hand)
                    result.player1.hand = result.player1.hand.length;
                }
              }
              result.player1.deck =
                result.player1.deck && result.player1.deck.length
                  ? result.player1.deck.length
                  : 0;
              result.player2.deck =
                result.player2.deck && result.player2.deck.length
                  ? result.player2.deck.length
                  : 0;
              tools.sendData(res, result, req, losDB, false);
            }
          }
        );
      } else {
        tools.sendError(res, 'You need to be connected');
      }
    });

    app.get('/match/getAllMatch', function(req, res) {
      losDB
        .collection('Match')
        .find()
        .toArray(function(err, result) {
          if (err != null) {
            tools.sendError(res, 'Error reaching mongo');
          } else {
            var ret = [];
            for (var match of result) {
              //              if(!match.status){
              //                match.status = "Deck is pending";
              //                losDB.collection('Match').update({"_id" : new ObjectId(match._id)},{$set: {status: match.status}});
              //              }
              match.player1.deck = match.player1.deck
                ? match.player1.deck.length
                : 0;
              match.player1.hand = match.player1.hand
                ? match.player1.hand.length
                : 0;
              match.player2.deck = match.player2.deck
                ? match.player2.deck.length
                : 0;
              match.player2.hand = match.player2.hand
                ? match.player2.hand.length
                : 0;
              ret.push(match);
            }
            tools.sendData(res, ret, req, losDB, false);
          }
        });
    });

    var all_different = function(array) {
      var ids = {};
      for (var elem of array) {
        if (ids[elem.key] === undefined) {
          ids[elem.key] = elem;
        } else {
          return false;
        }
      }
      return true;
    };

    var all_defined = function(deck, cb) {
      var deckRet = null;
      if (deck && deck instanceof Array && deck.length > 0) {
        deckRet = [];
        var n = 0;
        for (var card of deck) {
          var result = losDB
            .collection('Cards')
            .findOne({ key: card.key }, function(err, result) {
              if (err != null) {
                cb(null);
              } else if (result != null) {
                deckRet.push({
                  key: result.key,
                  name: result.name,
                  stats: result.stats,
                  title: result.title
                });
              }
              n++;
              if (deck.length === n) {
                cb(deckRet);
              }
            });
        }
      } else cb(deckRet);
    };

    function shuffle(a) {
      for (let i = a.length; i; i--) {
        let j = Math.floor(Math.random() * i);
        [a[i - 1], a[j]] = [a[j], a[i - 1]];
      }
    }
    app.get('/match/initDeck', function(req, res) {
      var sess = req.session;
      var deck = JSON.parse(req.query.deck);

      if (sess && sess.connectedUser) {
        if (deck && deck instanceof Array) {
          losDB.collection('Match').findOne(
            {
              $or: [
                { 'player1.id': sess.connectedUser._id },
                { 'player2.id': sess.connectedUser._id }
              ]
            },
            function(err, result) {
              if (err != null || !result) {
                tools.sendError(res, 'There is no match associated');
              } else {
                var curMatch = result;
                if (result.status && result.status === 'Deck is pending') {
                  var numPlayer =
                    result.player1.id == sess.connectedUser._id ? 1 : 2;
                  var player = numPlayer == 1 ? result.player1 : result.player2; //get the connected player info
                  if (
                    player.deck === undefined ||
                    (player.deck instanceof Array && player.deck.length === 0)
                  ) {
                    if (all_different(deck)) {
                      all_defined(deck, function(syncDeck) {
                        if (syncDeck != null && syncDeck.length <= 20) {
                          // deck max size is 20
                          shuffle(syncDeck);
                          player.deck = syncDeck;
                          var cb = function(err, result) {
                            tools.sendData(res, player, req, losDB, false);
                          };
                          if (numPlayer == 1) {
                            losDB
                              .collection('Match')
                              .update(
                                { _id: new ObjectId(curMatch._id) },
                                { $set: { 'player1.deck': syncDeck } },
                                cb
                              );
                          } else if (numPlayer == 2) {
                            losDB
                              .collection('Match')
                              .update(
                                { _id: new ObjectId(curMatch._id) },
                                { $set: { 'player2.deck': syncDeck } },
                                cb
                              );
                          }
                        } else {
                          tools.sendError(
                            res,
                            'Error during deck synchronisation'
                          );
                        }
                      });
                    } else {
                      tools.sendError(
                        res,
                        'There is twice the same card in your deck'
                      );
                    }
                  } else {
                    tools.sendError(res, 'A deck is already defined');
                  }
                } else {
                  tools.sendError(
                    res,
                    'The match status is not pending a deck'
                  );
                }
              }
            }
          );
        } else {
          tools.sendError(res, 'You need to specify a deck');
        }
      } else {
        tools.sendError(res, 'You need to be connected');
      }
    });

    app.get('/match/pickCard', function(req, res) {
      var sess = req.session;
      if (sess && sess.connectedUser) {
        losDB.collection('Match').findOne(
          {
            $or: [
              { 'player1.id': sess.connectedUser._id },
              { 'player2.id': sess.connectedUser._id }
            ]
          },
          function(err, result) {
            if (err != null || !result) {
              tools.sendError(res, 'There is no match associated');
            } else {
              var numPlayer =
                result.player1.id == sess.connectedUser._id ? 1 : 2;
              var player = numPlayer == 1 ? result.player1 : result.player2; //get the connected player info
              if (player.turn === true) {
                if (player.cardPicked === false) {
                  if (player.deck.length > 0) {
                    var card = player.deck.splice(0, 1)[0];
                    player.hand.push(card);
                    player.cardPicked = true;
                    losDB
                      .collection('Match')
                      .update({ _id: new ObjectId(result._id) }, result);
                    tools.sendData(res, card, req, losDB, false);
                  } else {
                    tools.sendError(res, 'Deck empty');
                  }
                } else {
                  tools.sendError(res, 'Card already picked');
                }
              } else {
                tools.sendError(res, 'Not your turn');
              }
            }
          }
        );
      } else {
        tools.sendError(res, 'You need to be connected');
      }
    });

    function containsCard(tab, card) {
      var ret = null;
      var i = 0;
      while (ret == null && i < tab.length) {
        var curCard = tab[i];
        if (curCard.key === card) {
          ret = i;
        }
        i++;
      }
      return ret;
    }

    app.get('/match/playCard', function(req, res) {
      var sess = req.session;
      var card = req.query.card;
      if (sess && sess.connectedUser) {
        losDB.collection('Match').findOne(
          {
            $or: [
              { 'player1.id': sess.connectedUser._id },
              { 'player2.id': sess.connectedUser._id }
            ]
          },
          function(err, result) {
            if (err != null || !result) {
              tools.sendError(res, 'There is no match associated');
            } else {
              var numPlayer =
                result.player1.id == sess.connectedUser._id ? 1 : 2;
              var player = numPlayer == 1 ? result.player1 : result.player2; //get the connected player info
              if (player.turn === true) {
                if (card) {
                  var iCard = containsCard(player.hand, card);
                  if (iCard != null) {
                    if (player.board.length < 5) {
                      var curCard = player.hand.splice(iCard, 1)[0];
                      curCard.attack = true;
                      player.board.push(curCard);
                      losDB
                        .collection('Match')
                        .update({ _id: new ObjectId(result._id) }, result);
                      tools.sendData(
                        res,
                        {
                          player: {
                            board: player.board,
                            hand: player.hand
                          }
                        },
                        req,
                        losDB,
                        false
                      );
                    } else {
                      tools.sendError(res, 'Board full');
                    }
                  } else {
                    tools.sendError(res, 'Card is not in the hand');
                  }
                } else {
                  tools.sendError(res, 'you need to specify a card');
                }
              } else {
                tools.sendError(res, 'Not your turn');
              }
            }
          }
        );
      } else {
        tools.sendError(res, 'You need to be connected');
      }
    });

    app.get('/match/attack', function(req, res) {
      var sess = req.session;
      var card = req.query.card;
      var ennemyCard = req.query.ennemyCard;
      if (sess && sess.connectedUser) {
        losDB.collection('Match').findOne(
          {
            $or: [
              { 'player1.id': sess.connectedUser._id },
              { 'player2.id': sess.connectedUser._id }
            ]
          },
          function(err, result) {
            if (err != null || !result) {
              tools.sendError(res, 'There is no match associated');
            } else {
              var numPlayer =
                result.player1.id == sess.connectedUser._id ? 1 : 2;
              var player = numPlayer == 1 ? result.player1 : result.player2; //get the connected player info
              var ennemyPlayer =
                numPlayer == 1 ? result.player2 : result.player1; //get the ennemy player info
              if (player.turn === true) {
                if (card) {
                  var iCard = containsCard(player.board, card);
                  if (iCard != null) {
                    card = player.board[iCard];
                    if (card.attack === undefined || card.attack === false) {
                      if (ennemyCard) {
                        var iCardEnnemy = containsCard(
                          ennemyPlayer.board,
                          ennemyCard
                        );
                        if (iCardEnnemy != null) {
                          var myCard = player.board[iCard];
                          myCard.attack = true;
                          var attackedEnnemyCard =
                            ennemyPlayer.board[iCardEnnemy];
                          if (
                            myCard.stats.attackdamage >
                            attackedEnnemyCard.stats.armor
                          ) {
                            var playerDamage =
                              myCard.stats.attackdamage -
                              attackedEnnemyCard.stats.armor;
                            ennemyPlayer.board.splice(iCardEnnemy, 1);
                            ennemyPlayer.hp -= playerDamage;
                            if (ennemyPlayer.hp <= 0) {
                              ennemyPlayer.turn = false;
                              player.turn = false;
                              result.status = 'Player ' + numPlayer + ' won';
                            }
                          } else if (
                            myCard.stats.attackdamage <
                            attackedEnnemyCard.stats.armor
                          ) {
                            player.board.splice(iCard, 1);
                          } else {
                            player.board.splice(iCard, 1);
                            ennemyCard.board.splice(iCardEnnemy, 1);
                          }
                          losDB
                            .collection('Match')
                            .update({ _id: new ObjectId(result._id) }, result);
                          tools.sendData(
                            res,
                            {
                              status: result.stats,
                              player1: {
                                board: result.player1.board,
                                hp: result.player1.hp
                              },
                              player2: {
                                board: result.player2.board,
                                hp: result.player2.hp
                              }
                            },
                            req,
                            losDB
                          );
                        } else {
                          tools.sendError(
                            res,
                            'Ennemy card is not in the board'
                          );
                        }
                      } else {
                        tools.sendError(
                          res,
                          'you need to specify an ennemyCard'
                        );
                      }
                    } else {
                      tools.sendError(res, 'This card has already attacked');
                    }
                  } else {
                    tools.sendError(res, 'you need to specify a card');
                  }
                } else {
                  tools.sendError(res, 'Your card is not in the board');
                }
              } else {
                tools.sendError(res, 'Not your turn');
              }
            }
          }
        );
      } else {
        tools.sendError(res, 'You need to be connected');
      }
    });

    app.get('/match/attackPlayer', function(req, res) {
      var sess = req.session;
      var card = req.query.card;
      if (sess && sess.connectedUser) {
        losDB.collection('Match').findOne(
          {
            $or: [
              { 'player1.id': sess.connectedUser._id },
              { 'player2.id': sess.connectedUser._id }
            ]
          },
          function(err, result) {
            if (err != null || !result) {
              tools.sendError(res, 'There is no match associated');
            } else {
              var numPlayer =
                result.player1.id == sess.connectedUser._id ? 1 : 2;
              var player = numPlayer == 1 ? result.player1 : result.player2; //get the connected player info
              var ennemyPlayer =
                numPlayer == 1 ? result.player2 : result.player1; //get the ennemy player info
              if (player.turn === true) {
                if (card) {
                  var iCard = containsCard(player.board, card);
                  if (iCard != null) {
                    card = player.board[iCard];
                    if (card.attack === undefined || card.attack === false) {
                      if (ennemyPlayer.board.length === 0) {
                        var myCard = player.board[iCard];
                        myCard.attack = true;
                        var playerDamage = myCard.stats.attackdamage;
                        ennemyPlayer.hp -= playerDamage;
                        if (ennemyPlayer.hp <= 0) {
                          ennemyPlayer.turn = false;
                          player.turn = false;
                          result.status = 'Player ' + numPlayer + ' won';
                        }
                        losDB
                          .collection('Match')
                          .update({ _id: new ObjectId(result._id) }, result);
                        tools.sendData(
                          res,
                          {
                            status: result.stats,
                            player1: {
                              board: result.player1.board,
                              hp: result.player1.hp
                            },
                            player2: {
                              board: result.player2.board,
                              hp: result.player2.hp
                            }
                          },
                          req,
                          losDB
                        );
                      } else {
                        tools.sendError(res, 'Ennemy board is not empty');
                      }
                    } else {
                      tools.sendError(res, 'This card has already attacked');
                    }
                  } else {
                    tools.sendError(res, 'Your card is not in the board');
                  }
                } else {
                  tools.sendError(res, 'you need to specify a card');
                }
              } else {
                tools.sendError(res, 'Not your turn');
              }
            }
          }
        );
      } else {
        tools.sendError(res, 'You need to be connected');
      }
    });

    app.get('/match/endTurn', function(req, res) {
      var sess = req.session;
      if (sess && sess.connectedUser) {
        losDB.collection('Match').findOne(
          {
            $or: [
              { 'player1.id': sess.connectedUser._id },
              { 'player2.id': sess.connectedUser._id }
            ]
          },
          function(err, result) {
            if (err != null || !result) {
              tools.sendError(res, 'There is no match associated');
            } else {
              var numPlayer =
                result.player1.id == sess.connectedUser._id ? 1 : 2;
              var player = numPlayer == 1 ? result.player1 : result.player2; //get the connected player info
              var ennemyPlayer =
                numPlayer == 1 ? result.player2 : result.player1; //get the ennemy player info
              if (player.turn === true) {
                for (var card of player.board) {
                  card.attack = false;
                }
                player.cardPicked = false;
                player.turn = false;
                ennemyPlayer.turn = true;
                losDB
                  .collection('Match')
                  .update({ _id: new ObjectId(result._id) }, result);
                tools.sendData(res, 'End of turn', req, losDB);
              } else {
                tools.sendError(res, 'Not your turn');
              }
            }
          }
        );
      } else {
        tools.sendError(res, 'You need to be connected');
      }
    });

    app.get('/match/finishMatch', function(req, res) {
      var sess = req.session;
      if (sess && sess.connectedUser) {
        losDB.collection('Match').findOne(
          {
            $or: [
              { 'player1.id': sess.connectedUser._id },
              { 'player2.id': sess.connectedUser._id }
            ]
          },
          function(err, result) {
            if (err != null || !result) {
              tools.sendError(res, 'There is no match associated');
            } else {
              var numPlayer =
                result.player1.id == sess.connectedUser._id ? 1 : 2;
              var player = numPlayer == 1 ? result.player1 : result.player2; //get the connected player info
              var ennemyPlayer =
                numPlayer == 1 ? result.player2 : result.player1; //get the ennemy player info
              if (player.turn === false && ennemyPlayer.turn === false) {
                var status = result.status;
                losDB
                  .collection('Match')
                  .remove({ _id: new ObjectId(result._id) });
                losDB
                  .collection('Matchmaking')
                  .remove({ 'match._id': new ObjectId(result._id) });
                tools.sendData(res, status, req, losDB);
              } else {
                tools.sendError(res, 'Match is not finished');
              }
            }
          }
        );
      } else {
        tools.sendError(res, 'You need to be connected');
      }
    });
  }
};
