const config = require('../config');
config.shouldConnectToDb = true;
const dbUtils = require('../utils/dbUtils');
const db = config.database;
const async = require('async');
const tbs = require('../services/telegramBotService');

const servers = require('../servers/servers');

exports.run = () => {
	console.info('starting setAllDistTodayToZero :', new Date().toString());
	tbs.sendAlert('starting setAllDistTodayToZero :' + new Date().toString());

	for (const key in servers) {
		servers[key].setAllDistTodayToZero();
	}

	dbUtils.getAsync(db.table_device_inventory, 'imei', null).then(devs => {
		async.eachLimit(devs, 10, (dev, done) => {
			dbUtils.updateAsync(db.table_device_inventory, {imei: dev.imei, dist_today: 0}).then(() => {
				done();
			}).catch(err => {
				done();
			});
		}, err => {
			console.info('finished setAllDistTodayToZero :', new Date().toString());
			tbs.sendAlert('finished setAllDistTodayToZero :' + new Date().toString());
		});
	}).catch(err => {

	});
};