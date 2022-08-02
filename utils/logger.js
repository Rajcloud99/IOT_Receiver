const winston = require('winston');
//winston.emitErrs = true;
const logger = winston.createLogger({
	transports: [
		new (winston.transports.Console)({
			handleExceptions: true,
			colorize: true,
			json: false
		}),
		// new (winston.transports.File)({
		//   name: 'info-file',
		//   filename: './logs/info.log',
		//   level: 'info',
		//   json: true
		// }),
		// new (winston.transports.File)({
		//   name: 'error-file',
		//   filename: './logs/error.log',
		//   level: 'error',
		//   json: true
		// })
	],
	exceptionHandlers: [
		// new winston.transports.File({ filename: './logs/exceptions.log' })
	],
	exitOnError: false
});

module.exports = logger;
