module.exports = {
  sendData: async function (res, data, req, losDB, display) {
    console.log('STATUS OK. return data : ');
    if (display === undefined || display) console.log(data);
    if (req.query.token) {
      const sessionStatus = await losDB.sessionStore.set(
        req.query.token,
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
    losDB.collection('Matchmaking').remove({ 'user._id': userId });
    losDB.collection('Matchmaking').remove({ 'match.player1.id': userId });
    losDB.collection('Matchmaking').remove({ 'match.player2.id': userId });
    losDB.collection('Match').remove({ 'player1.id': userId });
    losDB.collection('Match').remove({ 'player2.id': userId });
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
