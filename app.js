var fs = require('fs');
var https = require('https');
var express = require('express');
var MongoClient = require('mongodb').MongoClient;
var sess = require('express-session');


var tools = require('./modules/tools.js');
var users = require('./modules/users.js');
var matchmaking = require('./modules/matchmaking.js');
var match = require('./modules/match.js');
var cards = require('./modules/cards.js');

var app = express();

var losDB = null;
function initApp(losDB){
  //Allowing CORS connection
  var options = {
    key: fs.readFileSync('./rsa/amarger.murloc.fr.pem'),
    cert: fs.readFileSync('./rsa/amarger.murloc.fr.crt')
  };
  app.all("*", function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header('Content-Type', 'application/json');
    console.log("REQUEST : "+req.originalUrl);
    if(req.query)
      console.log(req.query);
    next();
  });
  
  //init session config
  app.use(sess({
    secret: 'Les loutres ça poutre!',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7200000 } // keep session activate during 2hours
  }))

  app.get('/', function (req, res) {
    sendData(res, "Hello World ! ");
  });

  users.init(app, tools, losDB);
  matchmaking.init(app, tools, losDB);
  cards.init(app, tools, losDB);
  match.init(app, tools, losDB, cards);
 
  var serverPort = 8080;
  var server = https.createServer(options, app);
  server.listen(serverPort, function() {
    console.log('server up and running at %s port', serverPort);
  });
}




MongoClient.connect('mongodb://localhost:27017/League_Of_Stones', function(err, db) {
  if (err) {
    throw err;
  }
  losDB = db;
  console.log("MONGO DB initialised : ");
  console.log(losDB.s.databaseName);
  initApp(db); //init app only when mongodb connection is set up
});