const express = require('express');
const expressSession = require('express-session');
const cors = require('cors');

const tools = require('./modules/tools.js');
const server = require('./modules/server.js');
const users = require('./modules/users.js');
const matchmaking = require('./modules/matchmaking.js');
const match = require('./modules/match.js');
const cards = require('./modules/cards.js');
const { MongoDBConnection} = require('./modules/connection.js');
const { Store } = require('./modules/connection.js');

var indexRouter = require('./modules/routes/index.js');
const app = express();

function initApp() {
  //Allowing CORS connection
  app.all('*', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    res.header('Content-Type', 'application/json');
    console.log('REQUEST : ' + req.originalUrl);
    if (req.query) console.log(req.query);
    if (req.header('WWW-Authenticate')) console.log('token', req.header('WWW-Authenticate'));
    if (req.header('WWW-Authenticate')) {
      Store.session.get(req.header('WWW-Authenticate'), function(error, session) {
        if (error === null) {
          req.session = session;
        }
        next();
      });
    } else next();
  });

  //init session config
  app.use(
    expressSession({
      secret: 'ceci est un secret!',
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 7200000 }, // keep session activate during 2hours,
      store: Store.session
    })
  );
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({extended: true}));

  app.use('/', indexRouter);
  // server.init(app, tools, losDB);
  // users.init(app, tools, losDB);
  // matchmaking.init(app, tools, losDB);
  // cards.init(app, tools, losDB);
  // match.init(app, tools, losDB, cards);

  const serverPort = process.env.PORT || 3001;
  app.listen(serverPort, function() {
    console.log('server up and running at %s port', serverPort);
  });
}


MongoDBConnection.connect().then(()=>{
  Store.initSession(expressSession);
  initApp()
  console.log('MONGO DB initialised : ');
  console.log(MongoDBConnection.db.databaseName);
});

