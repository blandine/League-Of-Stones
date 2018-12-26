module.exports = {
  init: function(app, tools, losDB) {
    var ObjectId = require('mongodb').ObjectID;

    app.get('/matchmaking/participate', function(req, res) {
      var sess = req.session;
      if (sess && sess.connectedUser && sess.connectedUser.email) {
        losDB
          .collection('Matchmaking')
          .findOne({ 'user.email': sess.connectedUser.email }, function(
            err,
            result
          ) {
            if (err) {
              tools.sendError(res, 'Error when reaching Mongodb : ' + err);
            } else {
              if (
                result &&
                result.user.email &&
                result.user.email == sess.connectedUser.email
              ) {
                sess.matchmakingId = result._id;
                tools.sendData(
                  res,
                  {
                    matchmakingId: result._id,
                    request: result.request,
                    match: result.match
                  },
                  req,
                  losDB
                );
              } else {
                losDB.collection('Matchmaking').insertOne(
                  {
                    user: sess.connectedUser,
                    request: []
                  },
                  function(err, resultMatch) {
                    if (err == null) {
                      sess.matchmakingId = resultMatch.insertedId;
                      tools.sendData(
                        res,
                        { matchmakingId: resultMatch.insertedId, request: [] },
                        req,
                        losDB
                      );
                    } else {
                      tools.sendError(
                        res,
                        'Error during inserting a matchmaking : ' + err
                      );
                    }
                  }
                );
              }
            }
          });
      } else {
        tools.sendError(res, 'You need to be connected');
      }
    });

    app.get('/matchmaking/unparticipate', function(req, res) {
      var sess = req.session;
      if (
        sess &&
        sess.connectedUser &&
        sess.connectedUser.email &&
        sess.matchmakingId
      ) {
        losDB
          .collection('Matchmaking')
          .findOne({ _id: new ObjectId(sess.matchmakingId) }, function(
            err,
            result
          ) {
            if (err != null) {
              tools.sendError(res, 'Error reaching MongoDB');
            } else if (result == null) {
              sess.matchmakingId = null;
              tools.sendError(res, 'Error matchmaking in cache (erased now)');
            } else {
              if (result.match) {
                tools.sendError(res, "Can't unparticipate when a match is on");
              } else {
                losDB
                  .collection('Matchmaking')
                  .find({
                    request: {
                      $elemMatch: { matchmakingId: sess.matchmakingId }
                    }
                  })
                  .toArray(function(err, result) {
                    if (err == null && result) {
                      for (var matchmaking of result) {
                        var request = matchmaking.request;
                        request.pop();
                        losDB
                          .collection('Matchmaking')
                          .update(
                            { _id: new ObjectId(matchmaking._id) },
                            { $set: { request: request } }
                          );
                      }
                    }
                  });
                losDB
                  .collection('Matchmaking')
                  .remove({ _id: new ObjectId(sess.matchmakingId) });
                tools.sendData(res, 'Unparticipated', req, losDB);
              }
            }
          });
      } else {
        tools.sendError('You need to be connected and in matchmaking');
      }
    });

    app.get('/matchmaking/getAll', function(req, res) {
      var sess = req.session;
      if (sess && sess.connectedUser && sess.connectedUser.email) {
        losDB
          .collection('Matchmaking')
          .find({ match: { $exists: false } })
          .toArray(function(err, result) {
            if (err) {
              tools.sendError(res, 'Error during reaching MongoDB');
            } else {
              var ret = [];
              for (var matchmaking of result) {
                if (matchmaking.user._id != sess.connectedUser._id)
                  ret.push({
                    email: matchmaking.user.email,
                    name: matchmaking.user.name,
                    matchmakingId: matchmaking._id
                  });
              }
              tools.sendData(res, ret, req, losDB);
            }
          });
      } else {
        tools.sendError(res, 'You need to be connected');
      }
    });

    app.get('/matchmaking/request', function(req, res) {
      var sess = req.session;
      var matchmakingId = req.query.matchmakingId;
      if (sess && sess.connectedUser && sess.connectedUser.email) {
        console.log('TEST : ' + sess.matchmakingId);
        if (sess.matchmakingId && sess.matchmakingId != matchmakingId) {
          losDB
            .collection('Matchmaking')
            .findOne({ _id: new ObjectId(matchmakingId) }, function(
              err,
              result
            ) {
              if (err != null) {
                tools.sendError(res, 'Error reaching MongoDB');
              } else if (result != null) {
                var request = result.request;
                request.push({
                  userId: sess.connectedUser._id,
                  matchmakingId: sess.matchmakingId,
                  name: sess.connectedUser.name
                });
                losDB
                  .collection('Matchmaking')
                  .update(
                    { _id: new ObjectId(matchmakingId) },
                    { $set: { request: request } },
                    function(err, result) {
                      if (err != null) {
                        tools.sendError(res, 'Error reaching MongoDB');
                      } else {
                        tools.sendData(res, 'Request sent', req, losDB);
                      }
                    }
                  );
              } else {
                tools.sendError(res, 'Matchmaking does not exist');
              }
            });
        } else {
          tools.sendError(res, "Can't request a match with yourself");
        }
      } else {
        tools.sendError(res, 'You need to be connected');
      }
    });

    app.get('/matchmaking/acceptRequest', function(req, res) {
      var sess = req.session;
      var matchmakingId = req.query.matchmakingId;
      if (
        sess &&
        sess.connectedUser &&
        sess.connectedUser.email &&
        sess.matchmakingId
      ) {
        losDB.collection('Matchmaking').findOne(
          {
            _id: new ObjectId(sess.matchmakingId),
            request: { $elemMatch: { matchmakingId: matchmakingId } }
          },
          function(err, result) {
            if (err != null) {
              tools.sendError(res, 'Error reaching mongo');
            } else if (result == null) {
              tools.sendError(res, 'request does not exists');
            } else {
              losDB
                .collection('Matchmaking')
                .findOne({ _id: new ObjectId(matchmakingId) }, function(
                  err,
                  result
                ) {
                  if (result.match == null) {
                    //Remove existing match (the new one will replace the previous ones)
                    losDB.collection('Match').remove({
                      'player1.id': new ObjectId(sess.connectedUser._id)
                    });
                    losDB.collection('Match').remove({
                      'player2.id': new ObjectId(sess.connectedUser._id)
                    });
                    losDB.collection('Match').remove({
                      'player1.id': new ObjectId(result.user._id)
                    });
                    losDB.collection('Match').remove({
                      'player2.id': new ObjectId(result.user._id)
                    });
                    var match = {
                      player1: {
                        name: result.user.name,
                        id: result.user._id
                      },
                      player2: {
                        name: sess.connectedUser.name,
                        id: sess.connectedUser._id
                      }
                    };
                    losDB
                      .collection('Match')
                      .insertOne(match, function(err, result) {
                        if (err == null) {
                          //match.id = result.insertedId;
                          losDB
                            .collection('Matchmaking')
                            .update(
                              { _id: new ObjectId(matchmakingId) },
                              { $set: { request: [], match: match } }
                            );
                          losDB
                            .collection('Matchmaking')
                            .update(
                              { _id: new ObjectId(sess.matchmakingId) },
                              { $set: { request: [], match: match } }
                            );
                          tools.sendData(res, match, req, losDB);
                        } else {
                          tools.sendError(res, 'Error during new match');
                        }
                      });
                  } else {
                    tools.sendError(res, 'Already in match (too late)');
                  }
                });
            }
          }
        );
      } else {
        tools.sendError(res, 'You need to be connected');
      }
    });
  }
};

/*

 losDB.collection('Users').find().toArray(function(err, result) {
          if (err) {
            tools.sendError(res, "Error during reaching MongoDB");
          }
          else{
            var ret = [];
            for(var user of result){
              ret.push({"email" : user.email, "name" : user.name});
            }
            tools.sendData(res, ret);
          }
        });
        
        
        */
