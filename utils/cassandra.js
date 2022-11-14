const geozoneCalculator = require('../services/geozoneCalculator');
const cassandraDbInstance = require('./cassandraDBInstance');
const config = require('../config');
const database = config.database;
const winston = require('./logger');
const dateutils = require('./dateutils');
const dbUtils = require('./dbUtils');
const async = require('async');

exports.insertGPSData = function (data) {
	if (!config.shouldConnectToDb) return;
	if(!data || !data.lat || !data.lng || !data.datetime) {
        winston.error('insert gps data error:' + data.device_id);
		return;
    }
	const query = 'INSERT INTO ' + database.table_gps_data + ' (device_id, satellites, latitude, longitude, speed, real_time, gps_tracking, course, mcc, mnc, lac, cid, datetime, inserted,ignition,input_state,sb,power_supply,fl,f_lvl) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';

	cassandraDbInstance.execute(query, [data.device_id,
			data.satellites,
			data.lat,
			data.lng,
			data.speed,
			data.real_time,
			data.gps_tracking,
			data.course,
			data.mcc,
			data.mnc,
			data.lac,
			data.cid,
			data.datetime,
			data.inserted,
		    data.ignition,
            data.input_state,
		    data.sb,
		    data.power_supply,
		    data.fl,
			data.f_lvl
		], {
			prepare: true
		},
		function (err, result) {
			if (err) {
				winston.error('after insert gps data error:' + err);
				winston.error(JSON.stringify(data));
			}
		});
};

exports.getGpsDataBetweenTimeAsync = function (imei, start, end) {
	return new Promise((resolve, reject) => {
		exports.getGpsDataBetweenTime(imei, start, end, (err, res) => {
			if (err) return reject(err);
			resolve(res);
		});
	});
};

exports.getGpsDataBetweenTime = function (imei, start, end, callback) {
	const query = 'SELECT latitude, longitude, speed ,datetime, inserted, gps_tracking, device_id,ignition,f_lvl,fl FROM ' + database.table_gps_data + ' WHERE device_id = ? AND datetime >= ? AND datetime <= ? order by datetime ASC ALLOW FILTERING';
    const options = { prepare : true , fetchSize : 1000 };
    let gpsData = [];
    cassandraDbInstance.eachRow(query, [imei, start, end], options, function (n, row) {
        gpsData.push(row);
    }, function (err, result) {
        if (err) {
            winston.error('cassandra.getGPSDataBetweenTime', err);
            callback(err);
            return;
        }
        if (result.nextPage) {
            result.nextPage();
        }else{
            calculateSpeedFromRaw(gpsData);
            callback(err, gpsData);
        }
    });
};
function calculateSpeedFromRaw(data, callback) {
	let duration = 0, speed = 0, distance = 0;
	let bNeedForSpped = true;
	let countExtra;
	//let iniLen = data.length;
	for (let i = 1; i < data.length; i++) {
        /*
        if(data[i-1].gps_tracking == null || data[i-1].gps_tracking == undefined){
            data.splice(i - 1, 1);
            i--;
            if((data.length - 1 == i) && (data[i].gps_tracking == null || data[i].gps_tracking == undefined)){//last data wrong
				data.splice(i, 1);
			}
            continue;
        }else if((data.length - 1 == i) && (data[i].gps_tracking == null || data[i].gps_tracking == undefined)){//last data wrong
            data.splice(i, 1);
            continue;
        }
        */
		try {
			// if (bNeedForSpped && data[i].speed > 0) bNeedForSpped = false;
			duration = data[i].datetime - data[i - 1].datetime;//msec
			duration = duration / 1000; //sec
			if (data[i - 1].latitude && data[i - 1].longitude && data[i].latitude && data[i].longitude) {
				distance = geozoneCalculator.getDistance({
					latitude: data[i - 1].latitude,
					longitude: data[i - 1].longitude
				}, {
					latitude: data[i].latitude,
					longitude: data[i].longitude
				});
			}

			if (distance > 0 && duration > 0) speed = distance / duration * 3.6;
			/*
			if (bNeedForSpped && speed > 0.99) {
				speed = Math.round(speed);
				data[i].speed = data[i].speed || speed;
			}
			*/
			if (data[i].speed > 120) {
				data[i].speed = 70;
			}
			if (distance > 2000 && speed > 100) {
				if (countExtra && (i - countExtra) == 1) {//2 consecutive point has anomoly then remove mid one
					//console.log("spliced for dist "+ distance + " dur "+ duration +" speed "+ distance/duration*3.6);
					data.splice(i - 1, 1);
					i--;
				} else {
					countExtra = i;
				}
			}
		} catch (e) {
			winston.error('on calculateSpeedFromRaw', e);
		}

	}
};

exports.insertHeartbeat = function (data, type, device_id) {
	if (!config.shouldConnectToDb) return;
	const query = 'INSERT INTO ' + database.table_heartbeat + ' (imei, datetime, acc_high, alarm_phone, alarm_terminal, charge_on, defense_activated, gps_tracking, gsm_signal_str, language, oil_power_dc, voltage) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)';
	cassandraDbInstance.execute(query, [data.device_id,
			data.datetime,
			data.acc_high,
			data.alarm_phone ? data.alarm_phone.code : null,
			data.alarm_terminal ? data.alarm_terminal.code : null,
			data.charge_on,
			data.defense_activated,
			data.gps_tracking,
			data.gsm_signal_str,
			data.language,
			data.oil_power_dc,
			data.voltage
		], {
			prepare: true
		},
		function (err, result) {
			if (err) {
				winston.error('insert heartbeat error', type, device_id, err);
			}
		});
};

exports.dbBulkWrite = function(aQueries,callback){
	if (aQueries && aQueries.length > 0) {
		cassandraDbInstance.batch(aQueries, {prepare: true}, function (err, result) {
			if (err) {
				callback(err, null);
				console.error(err);
				return;
			}
			if (!result) {
				return callback(err, null);
			}
			return callback(err, result);
		});
	}
}

exports.insertServerIpAndStatus = function (imei, ip, port, type,user_id) {
	if (!config.shouldConnectToDb) return;
	const query = 'INSERT INTO ' + database.table_device_inventory + ' (imei, ip, status, port, device_type,user_id,positioning_time) VALUES(?,?,?,?,?,?,?)';
	//console.log(imei,ip,port,type);
	cassandraDbInstance.execute(query, [
			imei,
			ip,
			'online',
			port || 0,
			type,
			user_id,
			Date.now()
		], {
			prepare: true
		},
		function (err, result) {
			if (err) {
				winston.error('insert io and status error:' + err);
			}
		});
};
exports.insertDeviceStatus = function (imei, acc_high, gsm_signal_str) {
	if (!config.shouldConnectToDb) return;
	const query = 'INSERT INTO ' + database.table_device_inventory + ' (imei, acc_high,acc_high_time,status, gsm_signal_str,positioning_time) VALUES(?,?,?,?,?)';
	cassandraDbInstance.execute(query, [imei,
			acc_high,
			acc_high_time,
			'online',
			gsm_signal_str,
			Date.now()
		], {
			prepare: true
		},
		function (err, result) {
			if (err) {
				winston.error('insert status error:' + err);
			}
		});
};

exports.insertDeviceStatusOnly = function (imei,status) {
    if (!config.shouldConnectToDb) return;
    const query = 'INSERT INTO ' + database.table_device_inventory + ' (imei, status, positioning_time) VALUES(?,?,?)';
    cassandraDbInstance.execute(query, [imei,status,Date.now()], {
            prepare: true
        },
        function (err, result) {
            if (err) {
                winston.error('insert status error:' + err);
            }
        });
};

exports.insertDeviceAddress = function (imei, address) {
	if (!config.shouldConnectToDb) return;
	const query = 'INSERT INTO ' + database.table_device_inventory + ' (imei, address) VALUES(?,?)';
	cassandraDbInstance.execute(query, [imei, address], {
			prepare: true
		},
		function (err, result) {
			if (err) {
				winston.error('insert status error:' + err);
			}
		});
};

exports.markAsOffline = function (imei) {
	if (!config.shouldConnectToDb) return;
	const query = 'INSERT INTO ' + database.table_device_inventory + ' (imei, ip, status) VALUES(?,?,?)';
	cassandraDbInstance.execute(query, [imei,
			null,
			'offline'
		], {
			prepare: true
		},
		function (err, result) {
			if (err) {
				winston.error('mark as offline error:' + err);
			}
		});
};

exports.markAllDevicesAsOfflineAsync = function () {
	return new Promise((resolve, reject) => {
		exports.markAllDevicesAsOffline(() => {
			resolve();
		});
	});
};

exports.markAllDevicesAsOffline = function (callback) {
	if (!config.shouldConnectToDb) return callback();
	dbUtils.getAsync(database.table_device_inventory, ['imei'], null).then(data => {
		async.eachLimit(data, 10, (datum, done) => {
			console.log('marking offline');
			dbUtils.update(database.table_device_inventory, {imei: datum.imei, status: 'offline'}, err => {done();});
		}, err => {
			callback();
		});
	});

};

exports.updateStatusReport = function (imei, online, datetime) {
	if (!config.shouldConnectToDb) return;
	const query = 'INSERT INTO ' + database.table_report_status + ' (imei, online, datetime) VALUES(?,?,?)';
	cassandraDbInstance.execute(query, [imei,
			online,
			datetime
		], {
			prepare: true
		},
		function (err, result) {
			if (err) {
				winston.error('update status report error:' + err);
			}
		});
};

exports.upsertAggregatedDrivesAndStopsReportEntry = function (data) {
	if (!config.shouldConnectToDb) return;
	if(data.distance/data.duration*3.6 > 150) return;
	Promise.resolve()
		.then(function () {
			const query = 'INSERT INTO ' + database.table_aggregated_drives_and_stops + ' (imei, drive, start_time, end_time, duration, start, stop, top_speed, distance, idle, start_addr, stop_addr, googleaddr) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)';
			cassandraDbInstance.execute(query, [data.imei,
					data.drive,
					data.start_time,
					data.end_time,
					data.duration,
					data.start,
					data.stop,
					data.top_speed,
					data.distance,
					!!data.idle,
					data.start_addr,
					data.stop_addr,
					!!data.fetchGoogleAddress
				], {
					prepare: true
				},
				function (err, result) {
					if (err) {
						winston.error('upsert adas error:' + err);
					}
				});
		});
};

exports.upsertAccReportEntry = function (data, type, device_id) {
	if (!config.shouldConnectToDb) return;
	const query = 'INSERT INTO ' + database.table_report_acc + ' (imei, start_time, acc_high, duration, end_time) VALUES (?,?,?,?,?)';
	console.log()
	cassandraDbInstance.execute(query, [data.imei,
			data.start_time,
			data.acc_high,
			data.duration,
			data.end_time
		], {
			prepare: true
		},
		function (err, result) {
			if (err) {
				winston.error('upsert acc error', type, device_id, err);
			}
		});
};

exports.upsertOverspeedReportEntry = function (data) {
	if (!config.shouldConnectToDb) return;
	const query = 'INSERT INTO ' + database.table_report_overspeed + ' (imei, start_time, end_time, duration, start, stop, top_speed, distance, start_addr) VALUES (?,?,?,?,?,?,?,?,?)';
	cassandraDbInstance.execute(query, [data.imei,
			data.start_time,
			data.end_time,
			data.duration,
			data.start,
			data.stop,
			data.top_speed,
			data.distance,
			data.start_addr
		], {
			prepare: true
		},
		function (err, result) {
			if (err) {
				winston.error('upsert upsertOverspeedReportEntry error:' + err);
			}
		});
};

exports.getAlerts = function (imei, callback) {
	const query = 'SELECT * FROM ' + database.table_Alarm + ' WHERE imei = ? AND enabled = ? ALLOW FILTERING';
	cassandraDbInstance.execute(query, [imei,1], {
		prepare: true
	}, function (err, result) {
		if (err) {
			winston.error('get alerts error:' + err);
			return callback(null);
		}
		if (result.rows.length === 0) return callback(null);
		callback(result.rows);
	});
};

exports.getLastAlertsAsync = function (oAlert) {
	return new Promise((resolve, reject) => {
		exports.getLastAlerts(oAlert, (err, res) => {
			if (err) return reject(err);
			resolve(res);
		});
	});
};

exports.getLastAlerts = function (oAlert, callback) {
	let minTimeDiff = new Date();
	minTimeDiff.setDate(minTimeDiff.getDate() - 10);//1 day
	const query = 'SELECT imei,code FROM ' + database.table_device_alerts + ' WHERE imei = ? AND code = ? AND datetime >= ? LIMIT 1 ALLOW FILTERING';
	cassandraDbInstance.execute(query, [oAlert.imei,oAlert.code,minTimeDiff.getTime()], {
		prepare: true
	}, function (err, result) {
		if (err) {
			winston.error('get alerts error:' + err);
			return callback(null);
		}
		callback(err,result.rows);
	});
};

exports.getAggregatedDASAsync = function (device_id, start_time, end_time) {
	return new Promise((resolve, reject) => {
		exports.getAggregatedDAS(device_id, start_time, end_time, (err, res) => {
			if (err) return reject(err);
			resolve(res);
		});
	});
};

exports.getAggregatedDAS = function (device_id, start_time, end_time, callback) {
	let query;
	if (device_id instanceof Array) {
		query = 'SELECT * FROM ' + database.table_aggregated_drives_and_stops + ' WHERE imei IN (' + device_id.join(', ') + ') AND drive in (true, false) AND start_time >= ' + new Date(start_time).getTime() + ' AND start_time < ' + new Date(end_time).getTime();
	} else {
		query = 'SELECT * FROM ' + database.table_aggregated_drives_and_stops + ' WHERE imei = ' + device_id + ' AND drive in (true, false) AND start_time >= ' + new Date(start_time).getTime() + ' AND start_time < ' + new Date(end_time).getTime();
	}
	// winston.info(query);
	cassandraDbInstance.execute(query, [], {
		prepare: true,
		fetchSize: 0
	}, function (err, result) {
		if (err) {
			winston.error('cassandra.getAggregatedDAS', query, err);
			return callback(err);
		}
		for (const key in result.rows) {
			if (!result.rows[key].idle) result.rows[key].idle = false;
		}
		callback(err, result.rows);
	});
};

exports.getAdasDailyAsync = function (device_id, start, end) {
	return new Promise((resolve, reject) => {
		exports.getAdasDaily(device_id, start, end, (err, res) => {
			if (err) return reject(err);
			resolve(res);
		});
	});
};

exports.getAdasDaily = function (device_id, start, end, callback) {
	let query;
	if (device_id instanceof Array) {
		query = 'SELECT * FROM ' + database.table_adas_daily + ' WHERE imei IN (' + device_id.join(', ') + ') AND date >= ' + start + ' AND date <= ' + end;
	} else {
		query = 'SELECT * FROM ' + database.table_adas_daily + ' WHERE imei = ' + device_id + ' AND date >= ' + start + ' AND date <= ' + end;
	}
	// winston.info(query);
	cassandraDbInstance.execute(query, [], {
		prepare: true,
		fetchSize: 0
	}, function (err, result) {
		if (err) {
			winston.error('cassandra.getadasdaily', err);
			return callback(err);
		}
		if (!result.rows || result.rows.length === 0) {
			return callback('no data');
		}
		callback(err, result.rows);
	});
};

exports.getAllDevicesAsync = () => {
	return new Promise((resolve, reject) => {
		exports.getAllDevices((err, res) => {
			if (err) return reject(err);
			resolve(res);
		});
	});
};

exports.getAllDevices = function (callback) {
	//return callback(null,[{imei:868298060394807,positioning_time:new Date(),reg_no:'NL01AC2431'}]);
	let  positionTime = new Date();
	positionTime.setDate(positionTime.getDate() - 10);
	positionTime = positionTime.getTime();
	let aParams = [positionTime,config.externalip || '52.77.145.71'];
	const query = 'SELECT imei,user_id,reg_no,dist_yesterday,dist_d_2,dist_d_3,dist_d_4,dist_d_5,dist_d_6,odo,positioning_time FROM ' + database.table_device_inventory +' WHERE positioning_time > ? AND ip = ? ALLOW FILTERING';
	//let aParams = [positionTime,'NAVKAR'];
	//const query = 'SELECT imei,user_id,reg_no,dist_yesterday,dist_d_2,dist_d_3,dist_d_4,dist_d_5,dist_d_6,odo,positioning_time FROM ' + database.table_device_inventory +' WHERE positioning_time > ? AND user_id = ? ALLOW FILTERING';
    const options = { prepare : true , fetchSize : 1000 };
    let aDevices = [];
    cassandraDbInstance.eachRow(query, aParams, options, function (n, row) {
        aDevices.push(row);
    }, function (err, result) {
        if (err) {
            winston.error('cassandra.getAllDevices', err);
            callback(err);
            return;
        }
        if (result.nextPage) {
            result.nextPage();
        }else{
            callback(null,aDevices);
        }
    });
};

exports.getAllDeviceIdsAsync = () => {
	return new Promise((resolve, reject) => {
		exports.getAllDeviceIds((err, res) => {
			if (err) return reject(err);
			resolve(res);
		});
	});
};

exports.getAllDeviceIds = function (callback) {
	const query = 'SELECT imei FROM ' + database.table_device_inventory+' ALLOW FILTERING';

    const options = { prepare : true , fetchSize : 1000 };
    let aDevices = [];
	let aParams = [];
    cassandraDbInstance.eachRow(query, aParams, options, function (n, row) {
        aDevices.push(row);
    }, function (err, result) {
        if (err) {
            winston.error('cassandra.getAllDeviceIds', err);
            callback(err);
            return;
        }
        if (result.nextPage) {
            result.nextPage();
        }else{
            callback(null,aDevices);
        }
    });
}; 

exports.getDeviceAsync = function (imei) {
	return new Promise((resolve, reject) => {
		exports.getDevice(imei, (err, res) => {
			if (err) return reject(err);
			resolve(res);
		});
	});
};

exports.getDevice = function (imei, callback) {
	const query = 'SELECT * FROM ' + database.table_device_inventory + ' WHERE imei = ?';
	cassandraDbInstance.execute(query, [imei], {
		prepare: true
	}, function (err, result) {
		if (err) {
			winston.error('cassandra.getDevice', err);
			callback(err);
			return;
		}
		if (result && result.rows && result.rows.length === 0) {
			callback('no device found');
			return;
		}
		let row = result.rows[0];
		for (let key in row) {
			if (row[key] instanceof Date) {
				row[key] = row[key].getTime();
			}
		}
		callback(err, row);
	});
};

exports.insertAdasMonthlyAsync = function (data) {
	return new Promise((resolve, reject) => {
		exports.insertAdasMonthly(data, (err, res) => {
			if (err) return reject(err);
			resolve(res);
		});
	});

};

exports.insertAdasMonthly = function (data, callback) {
	if (!config.shouldConnectToDb) return callback(null);
	const query = 'INSERT INTO ' + database.table_adas_monthly + ' (imei, date, distance, dur_drive, dur_idle, dur_stop, num_idle, num_stops, top_speed) VALUES (?,?,?,?,?,?,?,?,?)';
	cassandraDbInstance.execute(query, [
		data.imei,
		data.date,
		data.distance,
		data.dur_drive,
		data.dur_idle,
		data.dur_stop,
		data.num_idle,
		data.num_stops,
		data.top_speed
	], {
		prepare: true
	}, function (err, result) {
		callback(err, result);
	});
};

exports.insertAdasWeeklyAsync = function (data) {
	return new Promise((resolve, reject) => {
		exports.insertAdasWeekly(data, (err, res) => {
			if (err) return reject(err);
			resolve(res);
		});
	});

};

exports.insertAdasWeekly = function (data, callback) {
	if (!config.shouldConnectToDb) return callback(null);
	const query = 'INSERT INTO ' + database.table_adas_weekly + ' (imei, date, distance, dur_drive, dur_idle, dur_stop, num_idle, num_stops, top_speed) VALUES (?,?,?,?,?,?,?,?,?)';
	cassandraDbInstance.execute(query, [
		data.imei,
		data.date,
		data.distance,
		data.dur_drive,
		data.dur_idle,
		data.dur_stop,
		data.num_idle,
		data.num_stops,
		data.top_speed
	], {
		prepare: true
	}, function (err, result) {
		callback(err, result);
	});
};

exports.batchInsertAdasAsync = function (das) {
	return new Promise((resolve, reject) => {
		exports.batchInsertAdas(das, (err, res) => {
			if (err) return reject(err);
			resolve(res);
		});
	});
};

exports.batchInsertAdas = function (das, callback) {
	if (!config.shouldConnectToDb) return callback(null);
	if (!das || das.length === 0) return callback(null, 'no data');
	const data = das;
	const queries = [];
	const query = 'UPDATE ' + database.table_aggregated_drives_and_stops + ' SET distance = ?, stop = ? WHERE imei = ? AND drive = ? AND start_time = ?';
	for (let i = 0; i < data.length; i++) {
		queries.push({
			query: query,
			params: [
				data[i].distance,
				data[i].stop,
				data[i].imei,
				data[i].drive,
				data[i].start_time
			]
		});
	}
	// winston.info(JSON.stringify(queries[0]));
	if (queries.length === 0) return callback(null, true);

	cassandraDbInstance.batch(queries, {
		prepare: true
	}, function (err, result) {
		callback(err, result);
	});
};

exports.batchInsertAdasRefinedAsync = (imei, das) => {
	return new Promise((resolve, reject) => {
		exports.batchInsertAdasRefined(imei, das, (err, res) => {
			if (err) {
				console.log(imei,err.toString());
				return reject(err);
			}
			return resolve(res);
		});
	});
};
exports.batchInsertAdasRefinedNewAsync = (imei, das) => {
    return new Promise((resolve, reject) => {
        exports.batchInsertAdasRefinedNew(imei, das, (err, res) => {
        if (err) {
            //console.error(imei.toString(),err.toString()+ "  from batch adas batchInsertAdasRefinedNew ");
            return reject(err);
        }
        return resolve(res);
});
});
};
exports.batchInsertAdasRefined = function (imei, das, callback) {
	if (!config.shouldConnectToDb) return callback(null);
	if (!das || !das.data || das.data.length === 0) return callback('no data');
	Promise.resolve()
		.then(function () {
			const data = das.data;
			const queries = [];
			const query = 'INSERT INTO ' + database.table_adas_refined + ' (imei, drive, start_time, end_time, duration, idle_duration , start, stop, top_speed, distance, start_addr, stop_addr) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)';
			for (let i = 0; i < data.length; i++) {
				queries.push({
					query: query,
					params: [
						imei,
						data[i].drive,
						data[i].start_time,
						data[i].end_time,
						data[i].duration,
						data[i].idle_duration || 0,
						data[i].start,
						data[i].stop,
						data[i].top_speed,
						data[i].distance,
						data[i].start_addr,
						data[i].stop_addr
					]
				});
			}
			queries.push({
				query: 'INSERT INTO ' + database.table_adas_daily + ' (imei, date, distance, dur_drive, dur_idle, dur_stop, num_idle, num_stops, top_speed,odo) VALUES (?,?,?,?,?,?,?,?,?)',
				params: [
					imei,
					parseInt(dateutils.getYYYYMMDD(data[0].start_time)),
					das.tot_dist,
					das.dur_total - das.dur_stop,
					das.dur_idle || 0,
					das.dur_stop || 0,
					das.num_idle,
					das.num_stops,
					das.top_speed,

				]
			});
			// winston.info(JSON.stringify(queries));
			cassandraDbInstance.batch(queries, {
				prepare: true
			}, function (err, result) {
				callback(err, result);
			});
		});
};
exports.insertDailyAdas = function (data) {
    if (!config.shouldConnectToDb) return;
    query: 'INSERT INTO ' + database.table_adas_daily + ' (imei, date, distance, dur_drive, dur_idle, dur_stop, num_idle, num_stops, top_speed,odo) VALUES (?,?,?,?,?,?,?,?,?)',
    cassandraDbInstance.execute(query, [
            imei,
            parseInt(dateutils.getYYYYMMDD(data[0].start_time)),
            das.tot_dist,
            das.dur_total - das.dur_stop,
            das.dur_idle || 0,
            das.dur_stop || 0,
            das.num_idle,
            das.num_stops,
            das.top_speed,
		    das.odo || 0
        ], {
            prepare: true
        },
        function (err, result) {
            if (err) {
                winston.error('insert insertDailyAdas error:' + err);
            }
        });
};
exports.batchUpdateAdasDaily = function (imei, data, callback) {
    if (!config.shouldConnectToDb) return callback(null);
    if (!data || !data.length === 0) return callback('no data');
    Promise.resolve()
        .then(function () {
        const queries = [];
            for (let i = 0; i < data.length; i++) {
				queries.push({
					query: 'UPDATE ' + database.table_adas_daily + ' SET odo = ? WHERE date = ? AND imei = ? ',
					params: [
						data[i].odo,
						data[i].date,
						data[i].imei
					]
				});
            }
            cassandraDbInstance.batch(queries, {
                prepare: true
            }, function (err, result) {
                callback(err, result);
            });
        });
};

exports.batchInsertAdasRefinedNew = function (imei, das, callback) {
    if (!config.shouldConnectToDb) return callback(null);
    if (!das || !das.data || das.data.length === 0) return callback('no data');
    Promise.resolve()
        .then(function () {
            const data = das.data;
            const queries = [];
            const query = 'INSERT INTO ' + database.table_adas_refined + ' (imei, drive, start_time, end_time, duration, idle_duration , start, stop, top_speed, distance, start_addr, stop_addr,landmark,lmark,ldist) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
            for (let i = 0; i < data.length; i++) {
                queries.push({
                    query: query,
                    params: [
                        imei,
                        data[i].drive || false,
                        data[i].start_time,
                        data[i].end_time,
                        data[i].duration,
                        data[i].idle_duration || 0,
                        data[i].start,
                        data[i].stop,
                        data[i].top_speed,
                        data[i].distance,
                        data[i].start_addr,
                        data[i].stop_addr,
                        data[i].landmark,
						data[i].lmark,
						data[i].ldist
                    ]
                });
            }
            cassandraDbInstance.batch(queries, {
                prepare: true
            }, function (err, result) {
                callback(err, result);
            });
        });
};
exports.batchDeleteGpsDataAsync = (das) => {
    return new Promise((resolve, reject) => {
        exports.batchDeleteGpsData(das, (err, res) => {
        if (err) {
            console.log(imei,err.toString());
            return reject(err);
        }
        return resolve(res);
});
});
};
exports.batchDeleteGpsData = function (das, callback) {
    if (!config.shouldConnectToDb) return callback(null);
    if (!das || das.length === 0) return callback('no data');
    Promise.resolve()
        .then(function () {
            const data = das;
            const queries = [];
            const query = 'DELETE FROM ' + database.table_gps_data + ' where device_id = ? AND datetime = ?';
            for (let i = 0; i < data.length; i++) {
				//console.log(das[i].device_id,das[i].datetime);
                queries.push({
                    query: query,
                    params: [
                        das[i].device_id,
						das[i].datetime
                    ]
                });
            }
            cassandraDbInstance.batch(queries, {
                prepare: true
            }, function (err, result) {
				callback(err, result);
            });
        });
};
exports.insertDataPacket = function (data) {
    if (!config.shouldConnectToDb) return;
    const query = 'INSERT INTO ' + database.table_data_packets + ' (device_id,model,packet,parts,cmd,ip,datetime) VALUES(?,?,?,?,?,?,?)';
    cassandraDbInstance.execute(query, [
            data.device_id,
            data.model,
            data.packet,
            data.parts,
            data.cmd,
            data.ip,
            data.datetime
        ], {
            prepare: true
        },
        function (err, result) {
            if (err) {
                winston.error('insertDataPacket  error:' + err);
                winston.error(JSON.stringify(data));
            }
        });
};

exports.getDeviceToDebug = function (device_id, callback) {
    const query = 'SELECT * FROM ' + database.table_debug + ' WHERE device_id = ? ';
    cassandraDbInstance.execute(query, [device_id], {
        prepare: true
    }, function (err, result) {
        if (err) {
            winston.error('get getDeviceToDebug error:' + err);
            return callback(null);
        }
        if (result.rows.length === 0) return callback(null);
        callback(result.rows);
    });
};

exports.getGpsgaadiForUser = function (user_id, callback) {
    const query = 'SELECT imei FROM ' + database.table_gpsgaadi + ' WHERE user_id = ?';
    cassandraDbInstance.execute(query, [user_id], {
        prepare: true
    }, function (err, result) {
        if (err) {
            winston.error('cassandra.getDeviceForUser', err);
            callback(err);
            return;
        }
        callback(err, result.rows);
    });
};

exports.getGpsgaadiForUserAsync = (user_id) => {
	return new Promise((resolve, reject) => {
		exports.getGpsgaadiForUser(user_id, (err, res) => {
			if (err) return reject(err);
			return resolve(res);
		});
	});
};
exports.getDeviceByIMEIs = function (imeis, callback) {
    const query = 'SELECT imei,status,positioning_time,reg_no,driver,driver_name,driver_name2,user_id FROM ' + database.table_device_inventory + ' WHERE imei IN ( '+imeis.join(',') +') ';
    cassandraDbInstance.execute(query, [], {
        prepare: true
    }, function (err, result) {
        if (err) {
            winston.error('cassandra.getDeviceByIMEIs', err);
            callback(err);
            return;
        }
        callback(err, result.rows);
    })
};
exports.getDeviceByIMEIsAsync = (imeis) => {
	return new Promise((resolve, reject) => {
		exports.getDeviceByIMEIs(imeis, (err, res) => {
			if (err) return reject(err);
			return resolve(res);
		});
	});
};
