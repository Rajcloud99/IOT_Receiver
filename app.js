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

	const isDevelopServer = (ip === 'localhost');

	if(isDevelopServer) {
		process.env.NODE_ENV = 'develop';
	}
	isTestServer = true;
	process.env.NODE_ENV = 'test';
    //TODO check config
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
}).then(() => {
	global.prepareAPIdata  = function (aGpsgaadi,gps_data){};
	require('./utils/initiate.js');
});
