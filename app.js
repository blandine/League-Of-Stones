const fs = require('fs');
const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const sess = require('express-session');
const cors = require('cors');

const tools = require('./modules/tools.js');
const server = require('./modules/server.js');
const users = require('./modules/users.js');
const matchmaking = require('./modules/matchmaking.js');
const match = require('./modules/match.js');
const cards = require('./modules/cards.js');

const app = express();

let losDB = null;
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
    tools.sendData(res, 'League of Stones server is up ! Welcome :) ', req);
  });

  server.init(app, tools, losDB);
  users.init(app, tools, losDB);
  matchmaking.init(app, tools, losDB);
  cards.init(app, tools, losDB);
  match.init(app, tools, losDB, cards);

  const serverPort = process.env.PORT || 3001;
  app.listen(serverPort, function() {
    console.log('server up and running at %s port', serverPort);
  });
}

const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017';
const mongoDb = process.env.MONGO_DB || 'League_Of_Stones';
MongoClient.connect(
   mongoUrl,
  function(err, client) {
    if (err) {
      throw err;
    }
    losDB = client.db(mongoDb);
    initApp(losDB); //init app only when mongodb connection is set up
    console.log('MONGO DB initialised : ');
    console.log(losDB.databaseName);
  }
);
