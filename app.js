/**
* @Author: bharath
* @Date:   2016-11-18
*/

process.env.TZ = 'Asia/Calcutta';
const serverStartTime = Date.now();
const winston = require('./utils/logger');

require('./utils/externalip').getIpAsync().then(function(ip){
	const externalip = ip;
	let isProductionServer = false,isTestServer=false;
	if(ip === '52.77.111.181' || ip ==='65.1.183.173'){
		isProductionServer = true;
		process.env.NODE_ENV = 'truckadda';
	}
	if(ip ==='65.2.22.132'){
		isTestServer = true;
		process.env.NODE_ENV = 'trucku';
	}
	//const isProductionServer = (ip === '52.77.111.181');
	//const isTestServer = (ip === '52.77.145.71');
	const isDevelopServer = (ip === 'localhost');

	if(isDevelopServer) {
		process.env.NODE_ENV = 'develop';
	}

	require('./utils/dbConf').isDBLocal = false;
	const config = require('./config');
	config.shouldConnectToDb = true;

	winston.info('keyspace', ':', config.database.keyspace,process.env.NODE_ENV);

	config.externalip = externalip;
    config.isProductionServer = isProductionServer;
    config.isTestServer = isTestServer;
    config.isDevelopServer = isDevelopServer;
    const telegramBotService = require('./services/telegramBotService');
    telegramBotService.sendAlert((config.isProductionServer ? 'Production' : (config.isTestServer ? 'Test' : 'Develop')),  " IP " + config.externalip + '  Server started at :', new Date(serverStartTime).toLocaleString());

    winston.info('Server Type', ':', (config.isProductionServer ? 'Production' : (config.isTestServer ? 'Test' : 'Develop')));

	return Promise.resolve();
}).then(() => {
    return Promise.resolve();
	//if(require('./config').isProductionServer) return require('./utils/cassandra').markAllDevicesAsOfflineAsync();
}).then(() => {
    require('./utils/initiate.js');
});
