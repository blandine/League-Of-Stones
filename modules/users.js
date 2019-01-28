var bcrypt = require('bcrypt');
module.exports = {
  init: function(app, tools, losDB) {
    app.get('/users/getAll', function(req, res) {
      losDB
        .collection('Users')
        .find()
        .toArray(function(err, result) {
          if (err) {
            tools.sendError(res, 'Error during reaching MongoDB');
          } else {
            var ret = [];
            for (var user of result) {
              ret.push({ email: user.email, name: user.name });
            }
            tools.sendData(res, ret, req, losDB);
          }
        });
    });

    app.get('/users/subscribe', function(req, res) {
      var saltRounds = 10; // cost factor
      var hashPass = bcrypt.hashSync(req.query.password, saltRounds); //Hash creation with bcrypt
      var email = req.query.email;
      var name = req.query.name;
      if (hashPass && email && name) {
        losDB
          .collection('Users')
          .findOne({ email: email }, function(err, document) {
            if (err) {
              tools.sendError(res, 'Error during reaching MongoDB : ' + err);
            } else if (document) {
              tools.sendError(res, 'User already exists');
            } else {

              losDB.collection('Users').insertOne(
                {
                  email: email,
                  name: name,
                  password: hashPass
                },
                function(err, result) {
                  if (err == null) {
                    tools.sendData(res, { id: result.insertedId }, req, losDB);
                  } else {
                    tools.sendError(
                      res,
                      'Error during inserting a user : ' + err
                    );
                  }
                }
              );
            }
          });
      } else {
        tools.sendError(res, 'Error : you need to specify all the parameters');
      }
    });

    app.get('/users/unsubscribe', function(req, res) {
      var sess = req.session;
      var hashPass = req.query.password;
      var email = req.query.email;

      if (hashPass && email) {
        if (
          sess &&
          sess.connectedUser &&
          sess.connectedUser.email == email &&
          sess.connectedUser.password == hashPass
        ) {
          losDB
            .collection('Users')
            .findOne({ email: email }, function(err, document) {
              if (err || !document) {
                tools.sendError(res, 'Error during reaching MongoDB : ' + err);
                return;
              }
              bcrypt.compare(hashPass, document.password).then((isSameHash)=>{
                if (isSameHash) {
                 losDB.collection('Users').remove(
                   {email},
                   function(err, result) {
                     if (err == null) {
                       tools.removeInteractFromUser(
                         sess.connectedUser._id,
                         losDB
                       );
                       sess.connectedUser = null;
                       tools.sendData(res, 'User deleted', req, losDB);
                     } else {
                       tools.sendError(
                         res,
                         'Error during deleting a user : ' + err
                       );
                     }
                   }
                 );
               } else {
                 tools.sendError(res, "User doesn't exist");
               }
              });
            });
        } else {
          tools.sendError(res, "User doesn't exist");
        }
      } else {
        tools.sendError(res, 'Error : you need to specify all the parameters');
      }
    });

    //TODO : add token into the mongo base, clear it when token is obsolete, test if already connect thanks to the mongobase
    app.get('/users/connect', function(req, res) {
      var sess = req.session;
      var email = req.query.email;
      var hash = req.query.password;
      
      if (sess && sess.connectedUser) {
        tools.sendError(res, 'Already connected');
        return;
      } 
      losDB
        .collection('Users')
        .findOne({ email: email }, function(err, document) {
          if (err) {
            tools.sendError(res, 'Error during reaching MongoDB : ' + err);
          } else if (document) {
            bcrypt.compare(hash, document.password).then((isSameHash)=> { 
              if(isSameHash){
              sess.connectedUser = document;
              tools.sendData(
                res,
                {
                  id: document._id,
                  token: sess.id,
                  email: document.email,
                  name: document.name
                },
                req,
                losDB
              );
            } else {
              tools.sendError(res, 'Email or password incorrect');
            }});
          } else {
            tools.sendError(res, 'Email or password incorrect');
          }
        });
    });

    app.get('/users/disconnect', function(req, res) {
      var sess = req.session;
      if (sess && sess.connectedUser) {
        console.log('TEST DISCONNECT : ');
        console.log(sess.connectedUser._id);
        tools.removeInteractFromUser(sess.connectedUser._id, losDB);
        sess.connectedUser = null;
        sess.matchmakingId = null;
        losDB.sessionStore.destroy(req.query.token, function() {
          tools.sendData(res, 'Disconnected', req, losDB);
        });
      } else {
        tools.sendData(res, 'Not connected', req, losDB);
      }
    });

    app.get('/users/amIConnected', function(req, res) {
      var sess = req.session;
      if (sess) {
        if (sess.connectedUser) {
          tools.sendData(
            res,
            {
              connectedUser: {
                email: sess.connectedUser.email,
                name: sess.connectedUser.name
              }
            },
            req,
            losDB
          );
        } else {
          tools.sendData(
            res,
            {
              connectedUser: null
            },
            req,
            losDB
          );
        }
      }
    });

  }
};
