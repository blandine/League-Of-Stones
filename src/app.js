const express = require('express');
const expressSession = require('express-session');
const cors = require('cors');
var favicon = require('serve-favicon');
const createError = require('http-errors');
var path = require('path');
const { format, transports } = require('winston');
const { combine, colorize, printf } = format;
const expressWinston = require('express-winston');

const { SingleStore } = require('./utils/session.js');
var indexRouter = require('./routes/index.js');
const app = express();
SingleStore.connect();

//Allowing CORS connection
app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');
  res.header('Content-Type', 'application/json');
  const lToken = req.header('WWW-Authenticate');
  if (lToken) {
    SingleStore.sessionStore.get(
      lToken,
      function (error, session) {
        if (error) {
          next(createError(400, error));
        }
        req.session = session;
        next();
      }
      )
    }else{
      next();
    }
  });

app.use(
  expressSession({
    secret: 'ceci est un secret!',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7200000 }, // keep session activate during 2hours,
    store: SingleStore.sessionStore,
  })
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(favicon(path.join(__dirname, '../src/favicon.ico')))
app.get('/favicon.ico', (req, res) => res.status(204));



app.use(expressWinston.logger({
  transports: [new transports.Console()],
  format: combine(
    colorize(),
    printf(info => {
      const { meta, message } = info;
      const { req, res } = meta;
      let lBody = "";
      if(res && res.body){
        lBody+= " : "
        if(Array.isArray(res.body)){
          lBody += `Array(${res.body.length})`
        }else{
          lBody += `${JSON.stringify(res.body)}`
        }
      }
      const lToken = req && req.headers['WWW-Authenticate'] ? ' token : ' + req.header['WWW-Authenticate'] : "";
      return `${message}${lToken}${lBody}`
    })
  ),
  responseWhitelist: ['body'],
  bodyBlacklist: ["password"],
  msg: "{{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
  colorize: true, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
  ignoreRoute: function (req, res) { return false; }, // optional: allows to skip some log messages based on request and/or response

}));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  //console.error(err.message, err)
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  const response= {
    status: err.status,
    message: err.message
  }
  if(res.statusCode == 500){
    response.stack = err.stack
  }
  res.send(response);
});


module.exports = app;
