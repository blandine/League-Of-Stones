module.exports = {
  sendData: function(res, data, req, losDB, display) {
    console.log('STATUS OK. return data : ');
    if (display === undefined || display) console.log(data);
    if (req.query.token) {
      losDB.sessionStore.set(req.query.token, req.session, function(error) {
        res.send({
          status: 'ok',
          data: data
        });
      });
    } else {
      res.send({
        status: 'ok',
        data: data
      });
    }
  },
  sendError: function(res, message) {
    console.log('STATUS ERROR. Message : ');
    console.log(message);
    res.send({
      status: 'error',
      message: message
    });
  },
  removeInteractFromUser: function(userId, losDB) {
    var ObjectId = require('mongodb').ObjectID;
    losDB.collection('Matchmaking').remove({ 'user._id': userId });
    losDB.collection('Matchmaking').remove({ 'match.player1.id': userId });
    losDB.collection('Matchmaking').remove({ 'match.player2.id': userId });
    losDB.collection('Match').remove({ 'player1.id': userId });
    losDB.collection('Match').remove({ 'player2.id': userId });
  }

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
