var http = require('http');
const { MongoDBConnection } = require('../src/utils/database.js');

var app = require('../src/app');
const logger = require('../src/utils/logger.js');
const port = process.env.PORT || 3001;

var server = http.createServer(app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
server.on('listening', async () => {
  try {
    await MongoDBConnection.connect();
    logger.info('MONGO DB initialised : ' + MongoDBConnection.db.databaseName);

  } catch (err) {
    throw new Error(`Unable to connect to Mongo!` + err)
  }
})
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      logger.error(bind + ' requires elevated privileges');
      process.exit(1);
    case 'EADDRINUSE':
      logger.error(bind + ' is already in use');
      process.exit(1);
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  if (!addr) {
    console.error(`Server address is null`);
    return;
  }
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  logger.info(`Server League of Stones is running !`);

  if (typeof addr !== 'string') {
    logger.info(`http://localhost:${addr.port}`);
  }
}
