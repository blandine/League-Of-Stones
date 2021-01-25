module.exports = {
  sendData: async function (res, data, req, losDB, display) {
    console.log('STATUS OK. return data : ');
    if (display === undefined || display) console.log(data);

    if (req.header('WWW-Authenticate')) {
      const sessionStatus = await losDB.sessionStore.set(
        req.header('WWW-Authenticate'),
        req.session
      );
    } 
    res.send(data);
  },
  sendError: function (res, message, code=500) {
    console.log('STATUS ERROR. Message : ', message);
    res.status(code).send(message);
  },
  removeInteractFromUser: function (userId, losDB) {
    var ObjectId = require('mongodb').ObjectID;
    losDB.collection('Matchmaking').deleteMany({ 'user._id': userId });
    losDB.collection('Matchmaking').deleteMany({ 'match.player1.id': userId });
    losDB.collection('Matchmaking').deleteMany({ 'match.player2.id': userId });
    losDB.collection('Match').deleteMany({ 'player1.id': userId });
    losDB.collection('Match').deleteMany({ 'player2.id': userId });
  },
  deleteDb: async function (res, message, req, losDb) {
    const result = await losDb.dropDatabase();
    res.send('Server has been reinitialized');
  },
  //   getSession : function(token, losDB, callback){
  //     losDB.get(token, function(error, session){
  //       if(error === null){
  //         callback(session);
  //       }
  //       else{
  //         callback(null);
  //       }
  //     });
  //   }
};
