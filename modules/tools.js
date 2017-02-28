module.exports = {
  
  sendData: function(res, data, display){
    console.log("STATUS OK. return data : ");
    if(display === undefined || display)
      console.log(data);
    res.send({
      "status" : "ok",
      "data" : data
    });
  },
  sendError : function(res, message){
    console.log("STATUS ERROR. Message : ");
    console.log(message);
    res.send({
      "status" : "error",
      "message" : message
    });
  },
  removeInteractFromUser : function(userId, losDB){
    var ObjectId = require('mongodb').ObjectID;
    losDB.collection('Matchmaking').remove({"user._id" : new ObjectId(userId)});
    losDB.collection('Match').remove({"player1.id" : new ObjectId(userId)});
    losDB.collection('Match').remove({"player2.id" : new ObjectId(userId)});
  }
  
};