const GpsServer = require('../servers/gpsserver');
const socketServer = require('../servers/socketserver');
const reportServer = require('../servers/reportServer');
const httpServer = require('../servers/httpServer');
const servers = require('../servers/servers');
const config = require('../config');
const winston = require('./logger');
const telegramBotService = require('../services/telegramBotService');

function exitHandler(options, err) {
	if (options.sigint) {
		winston.info("called exit handler with sigint");
	}
	if (options.exception || options.rejection) {
		winston.error("called exit handler with ", options.exception ? 'exception' : 'rejection', '\n', err.stack);
	}
	winston.error("App is exiting. Cleaning up :");
	for (const key in servers) {
		servers[key].close();
		servers[key].disconnectAllDevices('cleanup');
	}
	socketServer.disconnect();
	setTimeout(() => {
		process.exit();
	}, 5000);
}

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {
	sigint: true
}));
//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {
	exception: true
}));
//catches unhandled rejections
process.on('unhandledRejection', exitHandler.bind(null, {
	rejection: true
}));

for (const key in config.servers) {
	if (!config.servers.hasOwnProperty(key)) continue;
	servers[key] = createServer(config.servers[key]);
}

function createServer(options) {
	return new GpsServer(options);
}
const CronJob = require('cron').CronJob;

const connJob = new CronJob({
	cronTime: '00 */30 * * * *',
	onTick: function () {
		const msg = {};
		for (const key in servers) {
			msg[key] = servers[key].getNumOfActiveConnections();
		}
		telegramBotService.sendMessage(JSON.stringify(msg) + " IP " + config.externalip);
	},
	start: true
});

if (config.isProductionServer || config.isTestServer) reportServer.startDailyJob();

if (config.isProductionServer || config.isTestServer) reportServer.startSetDistCurrentJob();

if(config.syncMongoDB && config.syncMongoDB.lms){
	const lmsServer = require('../servers/lmsServer');
	lmsServer.initializeDB();
}
