const GpsServer = require('../servers/gpsserver');
const socketServer = require('../servers/socketserver');
const reportServer = require('../servers/reportServer');
const httpServer = require('../servers/httpServer');
const servers = require('../servers/servers');
const config = require('../config');
const telegramBotService = require('../services/telegramBotService');
const winston = require('./logger');
const emailUtil = require('./emailUtils');
function exitHandler(options, err) {
	if (options.sigint) {
		winston.info("called exit handler with sigint");
		telegramBotService.sendAlert("called exit handler with sigint");
	}
	if (options.exception || options.rejection) {
		winston.error("called exit handler with ", options.exception ? 'exception' : 'rejection', '\n', err.stack);
		telegramBotService.sendAlert("Called exit handler with ", options.exception ? 'exception' : 'rejection', '\n', err.stack);

		if (config.isProductionServer || config.isTestServer || config.isDevelopServer) {
			emailUtil.mailToRepoOwners("Called exit handler with " + (options.exception ? 'exception ' : 'rejection ') + '\n' + err.stack, function (error, info) {
			});
		}
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

const fetchLocationJob = new CronJob({
	cronTime: '00 */5 * * * *',
	onTick: function () {
		for (const key in servers) {
			servers[key].getLocationOfAllDevices();
		}
	},
	start: true
});

if (config.isProductionServer || config.isTestServer) reportServer.startDailyJob();

if (config.isProductionServer || config.isTestServer) reportServer.startSetDistCurrentJob();

/*
const haltJob = new CronJob({
	cronTime: '00 *15 * * * *',
	onTick: function () {
		for (const key in servers) {
			for(const dev in servers[key].devices) {
                servers[key].devices[dev].findEligibleHalts();
			}
		}
	},
	start: true
});

const job = new CronJob({
	cronTime: '00 *15 * * * *',
	/*
	onTick: function () {
		const coeff = 1000 * 60 * 15;
		const date = new Date();
		const rounded = new Date(Math.round(date.getTime() / coeff) * coeff).getTime();
		for (const key in servers) {
			servers[key].forceInsertAllDevices(rounded);
		}
		winston.info('cron insert', new Date(rounded).toLocaleString());
	},
	start: true
});

  const notifJob = new CronJob({
        cronTime: '00 *30 * * * *',
        onTick: function () {
            let oNotifAlert = {
                data:{
                    title:new Date().toLocaleString(),
                    content : "This is test message to check all scenario of notification server. GPS test socket server is dispatching it " +
                    "in every 25 min interval"
                }};
            notificationDispService.dispatchNotification(['kamal','kamaltest'],oNotifAlert,function(err,resp){
                //console.log(err);
            });
        },
        start: true
    });

if (config.isTestServer)
	//continuousDrivingException.startDailyContDriveJob();
if (config.isTestServer)
      // offlineCron.findOfflineDevice();
//TODO separate service
//if (config.isTestServer) beatCron.prepareBeatCache();

//if (config.isTestServer || config.isProductionServer) reportServer.startSetDistTodayToZeroJob();

*/
