var fs = require('fs');
var express = require('express');
var MongoClient = require('mongodb').MongoClient;
var sess = require('express-session');
var cors = require('cors');

var tools = require('./modules/tools.js');
var users = require('./modules/users.js');
var matchmaking = require('./modules/matchmaking.js');
var match = require('./modules/match.js');
var cards = require('./modules/cards.js');

var app = express();

var losDB = null;
function initApp(losDB) {
  //Allowing CORS connection
  app.all('*', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    res.header('Content-Type', 'application/json');
    console.log('REQUEST : ' + req.originalUrl);
    if (req.query) console.log(req.query);
    if (req.query.token) {
      losDB.sessionStore.get(req.query.token, function(error, session) {
        if (error === null) {
          req.session = session;
        }
        next();
      });
    } else next();
  });

  //init session config
  losDB.sessionStore = new sess.MemoryStore();
  app.use(
    sess({
      secret: 'ceci est un secret!',
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 7200000 }, // keep session activate during 2hours,
      store: losDB.sessionStore
    })
  );
  app.use(cors());

  app.get('/', function(req, res) {
    tools.sendData(res, 'Hello World ! ', req);
  });

  users.init(app, tools, losDB);
  matchmaking.init(app, tools, losDB);
  cards.init(app, tools, losDB);
  match.init(app, tools, losDB, cards);

  var serverPort = 3001;
  app.listen(serverPort, function() {
    console.log('server up and running at %s port', serverPort);
  });
}

var mongoUrl = process.env.MONGO_URL || 'localhost';

MongoClient.connect(
  'mongodb://' + mongoUrl + ':27017',
  function(err, client) {
    if (err) {
      throw err;
    }
    losDB = client.db('League_Of_Stones');
    console.log('MONGO DB initialised : ');
    console.log(losDB.s.databaseName);
    initApp(losDB); //init app only when mongodb connection is set up
  }
);
