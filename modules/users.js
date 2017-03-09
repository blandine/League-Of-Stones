module.exports = {
    init : function(app, tools, losDB){
      var ObjectId = require('mongodb').ObjectID;
      
      app.get('/users/getAll', function(req, res){
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
      });

      app.get('/users/subscribe', function(req, res){
        var hashPass = req.query.password;
        var email = req.query.email;
        var name = req.query.name;
        if(hashPass && email && name){
           losDB.collection("Users").findOne({"email": email}, function(err, document){
            if(err){
              tools.sendError(res, "Error during reaching MongoDB : "+err);
            }
            else if(document){
              tools.sendError(res, "User already exists");
            }
            else{
              losDB.collection('Users').insertOne( {
                "email" : email,
                "password" : hashPass,
                "name" :name
              }, function(err, result){
                if(err == null){
                  tools.sendData(res, {"id" : result.insertedId});
                }
                else{
                  tools.sendError(res, "Error during inserting a user : "+err);
                }
              });
            }
          });
        }
        else{
          tools.sendError(res, "Error : you need to specify all the parameters");
        }
      });
      
      app.get('/users/unsubscribe', function(req, res){
        var sess = req.session;
        var hashPass = req.query.password;
        var email = req.query.email;
        if(hashPass && email){
          if(sess && sess.connectedUser && sess.connectedUser.email == email && sess.connectedUser.password == hashPass){
            losDB.collection("Users").findOne({"email": email}, function(err, document){
              if(err){
                tools.sendError(res, "Error during reaching MongoDB : "+err);
              }
              else if(document && document.password == hashPass){
                 losDB.collection('Users').remove( {
                    "email" : email,
                  }, function(err, result){
                    if(err == null){
                      tools.removeInteractFromUser(sess.connectedUser._id, losDB);
                      sess.connectedUser = null;
                      tools.sendData(res, "User deleted");
                    }
                    else{
                      tools.sendError(res, "Error during deleting a user : "+err);
                    }
                  });            
              }
              else{
                tools.sendError(res, "User doesn't exist");
              }
            });
          }
          else{
            console.log("session different from user");
            tools.sendError(res, "User doesn't exist");
          }
        }
        else{
          tools.sendError(res, "Error : you need to specify all the parameters");
        }
      });
      
      app.get("/users/connect", function(req, res){
        var sess = req.session;
        var email = req.query.email;
        var password = req.query.password;
        if(sess && sess.connectedUser){
          tools.sendError(res, "Already connected");
        }
        else{
          losDB.collection("Users").findOne({"email": email}, function(err, document){
            if(err){
              tools.sendError(res, "Error during reaching MongoDB : "+err);
            }
            else if(document){
              if(document.password == password){
                sess.connectedUser = document;
                tools.sendData(res, {
                  "id" : document._id,
                  "email" : document.email,
                  "name" : document.name
                });
              }
              else{
                console.log("WRONG PASS");
                tools.sendError(res, "Email or password incorrect");
              }
            }
            else{
              console.log("NO EMAIL");
              tools.sendError(res, "Email or password incorrect");
            }
          });
        }
        
      });
      
      app.get("/users/disconnect", function(req, res){
        var sess = req.session;
        if(sess && sess.connectedUser){
          tools.removeInteractFromUser(sess.connectedUser._id, losDB);
          sess.connectedUser = null;
          tools.sendData(res, "Disconnected");
        }
        else{
          tools.sendData(res, "Not connected");
        }
        
      });
      
      app.get("/users/amIConnected", function(req, res){
        var sess = req.session;
        if(sess){
          if(sess.connectedUser){
            tools.sendData(res, {
              "connectedUser" : {
                "email" : sess.connectedUser.email,
                "name" : sess.connectedUser.name
              }
            });
          }
          else{
            tools.sendData(res, {
              "connectedUser" : null
            });
          }
        }
      });
    }
};