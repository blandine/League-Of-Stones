var http = require('http');
const { MongoDBConnection } = require('../src/database.js');

var app =require('../src/app');
const port = process.env.PORT || 3001;
// listen(serverPort, function() {
//   console.log('server up and running at %s port', serverPort);
// });

var server = http.createServer(app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
server.on('listening', async ()=>{
	try {
        await MongoDBConnection.connect()
            console.log('MONGO DB initialised : ');
            console.log(MongoDBConnection.db.databaseName);
         
	  } catch (err) {
      throw new Error(`Unable to connect to Mongo!`+ err)
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
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
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
    if(!addr){
      console.error(`Server address is null`);
      return;
    }
    var bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
      console.info(`Server League of Stones is running !`);
      
      console.info('Listening on ' + bind);
      if(typeof addr !== 'string'){
      console.info(`http://localhost:${addr.port}`);
    }
  }
  