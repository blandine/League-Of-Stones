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

    app.put('/user', async function(req, res) {
      const {password, email, name} = req.body;
      if (password && email && name) {
        const saltRounds = 10; // cost factor
        const hashPass = bcrypt.hashSync(password, saltRounds); //Hash creation with bcrypt
        try {
          const user = await losDB.collection('Users').findOne({ email: email });
          if (user) {
            tools.sendError(res, 'User already exists', 409);
          } else {
            const newUser = await losDB.collection('Users').insertOne(
              {
                email: email,
                name: name,
                password: hashPass
              });
              tools.sendData(res, { id: newUser.insertedId }, req, losDB);
            }
        } catch{
          tools.sendError(res, 'Error during inserting a user : ' + err);
        }
    } else {
      tools.sendError(res, 'Missing parameters. Parameters are : name, email, password.', 500);
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
          sess.connectedUser.email === email 
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
                 tools.sendError(res, "User doesn't exist 2");
               }
              });
            });
        } else {
          tools.sendError(res, "User doesn't exist 1");
        }
      } else {
        tools.sendError(res, 'Error : you need to specify all the parameters');
      }
    });

    //TODO : add token into the mongo base, clear it when token is obsolete, test if already connect thanks to the mongobase
    app.post('/login', function(req, res) {
      const {email, password} = req.body;
      var sess = req.session;
      
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
            bcrypt.compare(password, document.password).then((isSameHash)=> { 
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

    app.post('/logout', function(req, res) {
      const sess = req.session;
      const token = req.header('WWW-Authenticate');
      if(!token) {
        tools.sendError(res, 'Missing token');
        return;
      }
      
      if (sess && sess.connectedUser) {
        tools.removeInteractFromUser(sess.connectedUser._id, losDB);
        sess.connectedUser = null;
        sess.matchmakingId = null;
        losDB.sessionStore.destroy(token, function() {
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
