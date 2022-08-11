const CronJob = require('cron').CronJob;
const deviceService = require('../services/deviceService');
const async = require('async');
const winston = require('../utils/logger');
const telegramBotService = require('../services/telegramBotService');
const cassandra = require('../utils/cassandra');
const dateutils = require('../utils/dateutils');
const dbUtils = require('../utils/dbUtils');
const config = require('../config');
const database = config.database;
const geozoneCalculator = require('../services/geozoneCalculator');
const dataProcessing = require('../utils/dataProcessing');
const setDistToCurrent = require('../scripts/setDistToCurrent');

global.allDevices = {};
global.limit = {speed:65};

module.exports.startSetDistTodayToZeroJob = function () {
	const job = new CronJob({
		cronTime: '00 01 00 * * *',
		onTick: () => {
			require('../scripts/setDistTodayToZero').run();
		},
		start: true
	});
};
module.exports.startSetDistCurrentJob = function () {
    const job = new CronJob({
        cronTime: '00 05 10 * * *',
        onTick: () => {
        	let dist;
            setDistToCurrent.run(dist);
        },
        start: true
    });
};
let djTime = '00 00 05 * * *';

if(config.cronJobs && config.cronJobs.dailyKM){
	djTime = config.cronJobs.dailyKM.time;
}

module.exports.startDailyJob = function () {
	const job = new CronJob({
		cronTime: djTime,
		onTick: aggregateReportInternal,
		start: true
	});
};

module.exports.aggregateReport = function (callback) {
	aggregateReportInternal(callback);
};

function aggregateReportInternal(callback) {
	winston.info('starting aggregation for ' + dateutils.getYesterdayMorning().toString());
	//telegramBotService.sendAlert('starting aggregation for ' + dateutils.getYesterdayMorning().toString());
	cassandra.getAllDevicesAsync()
		.then(function (devices) {
			const deviceIds = [];
			for (let i = 0; i < devices.length; i++) {
				deviceIds.push(devices[i].imei);
				allDevices[devices[i].imei] = devices[i];
			}
			telegramBotService.sendAlert('starting aggregation for ' + dateutils.getYesterdayMorning().toString() + ' devices '+deviceIds.length);
			return Promise.resolve(deviceIds);
		})
		.then(aggregateYesterdaysReport)
		.then(aggregateYesterweeksReport)
		.then(aggregateYestermonthsReport)
		.catch(function (err) {
			winston.info('report server err', err);
			telegramBotService.sendAlert('report server err' + err);
		})
		.then(function () {
			winston.info('finished aggregation for ' + dateutils.getYesterdayMorning().toString());
			telegramBotService.sendAlert('finished aggregation for ' + dateutils.getYesterdayMorning().toString());
			if (callback === undefined) return;
			callback(null, 'finished aggregation for ' + dateutils.getYesterdayMorning().toString());
		});
}

function aggregateYestermonthsReport(devices) {
	return new Promise((resolve, reject) => {
		if (dateutils.getMorning().getDate() !== 1) return resolve(devices);
		winston.info('aggregateYestermonthsReport ' + dateutils.getMorning().toString());
		async.eachSeries(devices, aggregateYestermonthsReportForDevice, function (err) {
			if (err) return reject(err);
			resolve(devices);
		});
	});
}

function aggregateYesterweeksReport(devices) {
	return new Promise((resolve, reject) => {
		if (dateutils.getMorning().getDay() !== 1) return resolve(devices);
		winston.info('aggregateYesterweeksReport ' + dateutils.getMorning().toString());
		async.eachSeries(devices, aggregateYesterweeksReportForDevice, function (err) {
			if (err) return reject(err);
			resolve(devices);
		});
	});
}

function aggregateYesterdaysReport(devices) {
	return new Promise((resolve, reject) => {
		async.eachSeries(devices, (imei, done) => {//10 days => 864000000 = 10 * 24 * 60 * 60 * 1000
            if(allDevices[imei] && allDevices[imei].positioning_time && ((Date.now() - new Date(allDevices[imei].positioning_time).getTime()) < 864000000)){
                aggregateYesterdaysReportForDevice(imei, (err, data) => {
                    if(data && data.imei && allDevices[data.imei] && data.das != undefined){
                       updateInventoryWithDist(allDevices[data.imei], data.das.tot_dist);
                       updateDailyAdas(allDevices[data.imei],data.das);
                    }
                   done();
                });
            }else{
                done();
            }

		}, function (err) {
			if (err) return reject(err);
			resolve(devices);
		});
	});

}

function updateInventoryWithDist(dev, dist) {
	dbUtils.updateAsync(database.table_device_inventory, {
		imei: dev.imei,
        dist_yesterday: dist || 0,
        dist_d_2: dev.dist_yesterday || 0,
        dist_d_3: dev.dist_d_2 || 0,
        dist_d_4: dev.dist_d_3 || 0,
        dist_d_5: dev.dist_d_4 || 0,
        dist_d_6: dev.dist_d_5 || 0,
        dist_d_7: dev.dist_d_6 || 0,
        odo : (dev.odo || 0 ) + (dist || 0)
	}).then(function(){
        setDistToCurrent.updateDistanceAndOdoToday(dev.imei,(dev.odo || 0 ) + dist,function(){
            //console.log('updateDistanceAndOdoToday ');
        });
	});
}

function updateDailyAdas(dev, das) {
    dbUtils.update(database.table_adas_daily, {
        imei: dev.imei,
        date: parseInt(dateutils.getYYYYMMDD(das.data[0].start_time)),
        distance: das.tot_dist || 0,
        dur_drive: das.dur_total - das.dur_stop || 0,
        dur_idle:das.dur_idle || 0,
        dur_stop: das.dur_stop || 0,
        num_idle: das.num_idle,
        num_stops: das.num_stops,
        top_speed: das.top_speed,
        odo : (dev.odo || 0 ) + das.tot_dist
    });
}

function aggregateYestermonthsReportForDevice(imei, done) {
	const start = dateutils.getYesterdayMorning();
	start.setDate(1);
	aggregateDailyDataForDevice(imei, dateutils.getYYYYMMDD(start), dateutils.getYYYYMMDD(dateutils.getYesterdayMorning()))
		.then(function (data) {
			return cassandra.insertAdasMonthlyAsync(data);
		})
		.catch(function () {
		})
		.then(function () {
			done();
		});
}

function aggregateYesterweeksReportForDevice(imei, done) {
	const start = dateutils.getMorning();
	start.setDate(start.getDate() - 7);
	aggregateDailyDataForDevice(imei, dateutils.getYYYYMMDD(start), dateutils.getYYYYMMDD(dateutils.getYesterdayMorning()))
		.then(function (data) {
			return cassandra.insertAdasWeeklyAsync(data);
		})
		.catch(function () {
		})
		.then(function () {
			done();
		});
}

function aggregateYesterdaysReportForDevice(imei, done) {
	//aggregateReportForDevice(imei, dateutils.getYesterdayMorning(), dateutils.getMorning(), done);
	aggregateReportForDeviceV2(imei, dateutils.getYesterdayMorning(), dateutils.getMorning(), done);
}

function aggregateDailyDataForDevice(imei, start, end, callback) {
	return new Promise((resolve, reject) => {
		// winston.info("starting aggregation for ", imei.toString(), ' for ', start, end);
		cassandra.getAdasDailyAsync(imei, start, end)
			.then(function (data) {
				for (let i = 1; i < data.length; i++) {
					data[0].distance += data[i].distance;
					data[0].dur_drive += data[i].dur_drive;
					data[0].dur_idle += data[i].dur_idle;
					data[0].dur_stop += data[i].dur_stop;
					data[0].num_idle += data[i].num_idle;
					data[0].num_stops += data[i].num_stops;
					if(data[0].top_speed < data[i].top_speed && data[i].top_speed < 90){
                        data[0].top_speed = data[i].top_speed;
					}
				}
				resolve(data[0]);
			})
			.catch(function (err) {
				// winston.info(imei, err);
				reject(err);
			});
	});
}

function aggregateReportForDevice(imei, start, end, done) {
	// winston.info("starting aggregation for ", imei.toString(), ' for ', dateutils.getMorning(new Date(start)));
	let dist;
	cassandra.getAggregatedDASAsync(imei, dateutils.getMorning(new Date(start)).getTime(), dateutils.getMorning(new Date(end)).getTime()).then(function (das) {
		for (let i = 0; i < das.length; i++) {
			if ((das[i].distance / das[i].duration * 3.6 > 160) || (das[i].distance / das[i].duration * 3.6 < 2)) {
				//das[i].distance = 0;
				das[i].drive = false;
			}
		}
		return deviceService.processADASReportAsync(das);
	}).then(function (res) {
		if(res && res[imei]){
            res = res[imei];
            dist = res.tot_dist;
            return cassandra.batchInsertAdasRefinedAsync(imei, res);
		}else{
		    console.log('error in',imei);
            return;
        }

	}).catch(function (err) {
		winston.info(imei, err);
	}).then(function () {
		// winston.info("finished aggregation for device ", imei.toString());
		done(null, {
			imei: imei,
			dist: dist
		});
	});
}
function aggregateReportForDeviceV2(imei, start, end, done) {
	//TODO also do chnage logic in continous driving alert aggregateReportForDeviceV2Copy
     winston.info("starting aggregation for ", imei.toString(), ' for ', dateutils.getMorning(new Date(start)));
    let dist,resp;
    cassandra.getGpsDataBetweenTimeAsync(imei, dateutils.getMorning(new Date(start)).getTime(), dateutils.getMorning(new Date(end)).getTime()).then(function (das) {
        return dataProcessing.processRawDataAsync(imei,das);
    }).then(function (das) {
            dataProcessing.checkAnomaly(das);
    		let oSettings = {removePoints:true};
    		dataProcessing.checkIdleingFromADAS(das,oSettings);
        for (let i = 0; i < das.length; i++) {
            if (das[i].distance / das[i].duration * 3.6 > 100) {
                das[i].distance = 0;
                das[i].drive = false;
            }else if ( das[i].distance / das[i].duration * 3.6 < 3) {
				das[i].drive = false;
			}else if(das[i].distance < 250 && (das[i].distance / das[i].duration * 3.6 < 10)){
               // das[i].distance = 0;
                das[i].drive = false;
            }else{
				//console.log(das[i].distance,das[i].duration,das[i].distance / das[i].duration * 3.6);
			}
        }
        return deviceService.processADASReportV2Async(das);
    }).then(function (res) {
        if(res){
            resp = res[imei];
            dist = (resp && resp.tot_dist) || 0;
			return cassandra.batchInsertAdasRefinedNewAsync(imei, resp);
        }else{
            return;
        }

    }).catch(function (err) {
        winston.info(imei, err);
    }).then(function () {
        done(null, {
            imei: imei,
            das: resp
        });
    });
}
module.exports.aggregateReportFromRaw = function (callback) {
    aggregateReportInternalFromRawData(callback);
};

function aggregateReportInternalFromRawData(callback) {
    console.log('starting aggregation for ' + dateutils.getYesterdayMorning().toString());
    telegramBotService.sendAlert('starting aggregation for ' + dateutils.getYesterdayMorning().toString());
    cassandra.getAllDevicesAsync()
        .then(function (devices) {
            const deviceIds = [];
            for (let i = 0; i < devices.length; i++) {
                deviceIds.push(devices[i].imei);
                allDevices[devices[i].imei] = devices[i];
            }
            return Promise.resolve(deviceIds);
        })
        .then(aggregateYesterdaysReport)
        .then(aggregateYesterweeksReport)
        .then(aggregateYestermonthsReport)
        .catch(function (err) {
            console.log('report server err', err);
            telegramBotService.sendAlert('report server err' + err);
        })
        .then(function () {
            winston.info('finished aggregation for ' + dateutils.getYesterdayMorning().toString());
            telegramBotService.sendAlert('finished aggregation for ' + dateutils.getYesterdayMorning().toString());
            if (callback === undefined) return;
            callback(null, 'finished aggregation for ' + dateutils.getYesterdayMorning().toString());
        });
}
