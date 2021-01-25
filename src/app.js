const express = require('express');
const expressSession = require('express-session');
const cors = require('cors');
const createError = require('http-errors');

var favicon = require('serve-favicon');
var path = require('path');


var indexRouter = require('./routes/index.js');
const app = express();

//Allowing CORS connection
app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');
  res.header('Content-Type', 'application/json');
  console.log('REQUEST : ' + req.originalUrl);
  if (req.query) console.log(req.query);
  if (req.header('WWW-Authenticate'))
    console.log('token', req.header('WWW-Authenticate'));
  if (req.header('WWW-Authenticate')) {
    req.session.get(
      req.header('WWW-Authenticate'),
      function (error, session) {
        if (error === null) {
          req.session = session;
        }
        next();
      }
    );
  } else next();
});

//init session config
app.use(
  expressSession({
    secret: 'ceci est un secret!',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7200000 }, // keep session activate during 2hours,
    store: new expressSession.MemoryStore(),
  })
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(favicon(path.join(__dirname, '../src/favicon.ico')))
app.get('/favicon.ico', (req, res) => res.status(204));
app.use('/', indexRouter);
// catch 404 and forward to error handler
app.use(function (req,res,next) {
	next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	console.error(err.message, err)
	res.locals.error = req.app.get('env') === 'development' ? err : {};
	// render the error page
	res.status(err.status || 500);
  res.send(err);
});


module.exports = app;
