const {createLogger,format,transports} = require('winston');
const { combine,colorize,simple} = format;
const logger = createLogger({
  level: 'silly',
  format: combine(
    colorize(),
    simple()
  ),
  transports: [new transports.Console()],
});



module.exports=logger;