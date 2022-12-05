const geozoneCalculator = require('./geozoneCalculator');
const cassandraDbInstance = require('../utils/cassandraDBInstance');
const database = require('../config').database;
const winston = require('../utils/logger');
const shouldConnectToDb = require('../config').shouldConnectToDb;
const async = require('async');
const dateutils = require('../utils/dateutils');
const BPromise = require('bluebird');
const addressService = require('../services/addressService');
const allowedFieldsForUpdate = ['geofence_status','halt_location_time','halt_detection_time', 'address', 'lat', 'lng', 'speed', 'course', 'location_time', 'positioning_time', 'status', 'ac_on', 'gsm_signal_str','dist_today','acc_high','acc_high_time','power_supply','power_supply_time','f_lvl'];
function prepareUpdateQuery(oDevice) {
    let sQuery = "",
        aParam = [],
        oRet = {};
    for (const key in oDevice) {
        if (allowedFieldsForUpdate.indexOf(key) > -1) {
            aParam.push(oDevice[key]);
            if (sQuery) { // prevent ',' to append initially
                sQuery = sQuery + "," + key + "=?";
            } else {
                sQuery = key + "=?";
            }
        }
    }
    oRet.sQuery = sQuery;
    oRet.aParam = aParam;
    return oRet;
}
function prepareString(aUsers){
    str='';
    for(let i=0;i<aUsers.length;i++){
        if(i==0){
            str= "'"+aUsers[i]+"'";
        } else{
            str= str+",'"+aUsers[i]+"'";
        }
    }
    return str;
}
exports.getGpsgaadiAsync = function(request) {
	return new Promise((resolve, reject) => {
		exports.getGpsgaadi(request, (err, res) => {
			if(err) return reject(err);
			resolve(res);
		});
	});
};

exports.getGpsgaadi = function(request, callback) {
    let sId, sKey;
    if (request.request === 'gpsgaadi_by_imei') {
        sId = parseInt(request.imei);
        sKey = 'imei';

    } else if (request.request === 'gpsgaadi_by_uid') {
        sId = request.selected_uid;
        sKey = 'user_id';
    } else if (request.request === 'gpsgaadi_by_reg_no') {
        sId = request.reg_no;
        sKey = 'reg_no';
    }
    let query = 'SELECT user_id,reg_no,sos_nos,branch FROM ' + database.table_gpsgaadi + ' WHERE ' + sKey + ' = ?';
    cassandraDbInstance.execute(query, [sId], {
        prepare: true
    }, function(err, result) {
        if (err) {
            winston.error('deviceService.getGpsgaadi', err);
            callback(err);
            return;
        }
        if (result && result.rows && result.rows.length === 0) {
            if (request.request === 'gpsgaadi_by_reg_no') {
                callback(err, {});
            } else {
                callback(err, []);
            }
            return;
        }
        if (result && result.rows) {
            if (request.request === 'gpsgaadi_by_reg_no') {
                callback(err, result.rows[0]);
            } else {
                callback(err, result.rows);
            }
        }

    });
};

exports.getUsersAsync = function(aUserIds) {
	return new Promise((resolve, reject) => {
		exports.getUsers(aUserIds, (err, res) => {
			if(err) return reject(err);
			resolve(res);
		});
	});
};

exports.getUsers = function(aUserIds, callback) {
    let sUserIds = prepareString(aUserIds);
    let query = "SELECT mobile,email,user_id,mobile_imeis FROM " + database.table_users + " WHERE user_id IN (" +sUserIds+ ")";
    cassandraDbInstance.execute(query, [], {
        prepare: true
    }, function(err, result) {
        if (err) {
            winston.error("get Users" + err.toString());
            callback(err);
            return;
        }
        if (result && result.rows && result.rows.length === 0) {
            callback(err, []);
            return;
        }
        if (result && result.rows) {
            callback(err, result.rows);
        }

    });
};

exports.getMobileDevicesAsync = (sIMEIs) => {
	return new Promise((resolve, reject) => {
		exports.getMobileDevices(sIMEIs, (err, res) => {
			if(err) return reject(err);
			resolve(res);
		});
	});
};

exports.getMobileDevices = function(sIMEIs, callback) {
    let query = 'SELECT imei,fcm_key,notification FROM ' + database.table_mobile_device + ' WHERE imei IN (?)';
    cassandraDbInstance.execute(query, [sIMEIs], {
        prepare: true
    }, function(err, result) {
        if (err) {
            winston.error("get Mobile Devices" + err);
            callback(err);
            return;
        }
        if (result && result.rows && result.rows.length === 0) {
            callback(err, []);
            return;
        }
        if (result && result.rows) {
            callback(err, result.rows);
        }

    });
};

exports.getMobileDevicesByUserIdAsync = (user_id) => {
	return new Promise((resolve, reject) => {
		exports.getMobileDevicesByUserId(user_id, (err, res) => {
			if(err) return reject(err);
			resolve(res);
		});
	});
};

module.exports.getMobileDevicesByUserId = function(user_id, callback) {
    let query = 'SELECT imei,fcm_key,notification FROM ' + database.table_mobile_device + ' WHERE user_id = ? ALLOW FILTERING';
    cassandraDbInstance.execute(query, [user_id], {
        prepare: true
    }, function(err, result) {
        if (err) {
            winston.error("getMobileDevicesByUserId Devices" + err);
            callback(err);
            return;
        }
        if (result && result.rows && result.rows.length === 0) {
            callback(err, []);
            return;
        }
        if (result && result.rows) {
            callback(err, result.rows);
        }

    });
};

exports.getLatestLocation = function(sIMEIs, callback) {
    let query = 'SELECT * FROM ' + database.table_device_inventory + ' WHERE imei IN ( ? )';
    cassandraDbInstance.execute(query, [sIMEIs], {
        prepare: true
    }, function(err, result) {
        if (err) {
            winston.error("get latest Location " + err.toString());
            callback(err);
            return;
        }
        if (result && result.rows && result.rows.length === 0) {
            callback(err, []);
            return;
        }
        if (result && result.rows) {
            callback(err, result.rows);
        }

    });
};

exports.updateDeviceInventory = function(device, callback) {
	if (!shouldConnectToDb) return callback();
    const oQueryParam = prepareUpdateQuery(device);
    let sQuery = oQueryParam.sQuery;
    let aParam = oQueryParam.aParam;
    aParam.push(device.imei);
    sQuery = 'UPDATE ' + database.table_device_inventory + ' SET ' + sQuery + ' WHERE imei=?';

    //if(device.imei === 359704070019629) winston.info('udi', sQuery, JSON.stringify(aParam));
    cassandraDbInstance.execute(sQuery, aParam, {prepare: true }, function(err, result) {
        if (err) {
            callback(err, null);

            winston.error('Device.updateDevice', err ,sQuery,aParam);
            return;
        }
        if (!result) {
            return callback(err, null);
        }
        return callback(err, device);
    });
};

exports.getDeviceNotificationSettingsAsync = (device_id, aMobile_imeis) => {
	return new Promise((resolve, reject) => {
		exports.getDeviceNotificationSettings(device_id, aMobile_imeis, (err, res) => {
			if(err) return reject(err);
			resolve(res);
		});
	});
};

exports.getDeviceNotificationSettings = function(device_id, aMobile_imeis, callback) {
    let query = 'SELECT * FROM ' + database.table_notification_pref + ' WHERE device_id = ? AND mobile_imei IN ( ? )';
    let aParams = [device_id, aMobile_imeis];
    cassandraDbInstance.execute(query, aParams, {
        prepare: true
    }, function(err, result) {
        if (err) {
            winston.error("get getDevice Notification Settings  " + err.toString());
            callback(err);
            return;
        }
        if (result && result.rows) {
            callback(err, result.rows);
        }

    });
};

function combineADASData(device) {
	return new Promise((resolve, reject) => {
		for (let i = 1; i < device.data.length; i++) {
		    //don't club drives and stops tgether
			if (device.data[i].drive !== device.data[i - 1].drive) continue;
			//don't club idle and stop together
			if (device.data[i].idle !== device.data[i - 1].idle) continue;
            //can't club more than 30 min diff
			if ((new Date(device.data[i].start_time).getTime() - new Date(device.data[i - 1].end_time).getTime()) > 30 * 60 * 1000) continue;

			device.data[i - 1].end_time = device.data[i].end_time;
			device.data[i - 1].stop = device.data[i].stop;
			device.data[i - 1].stop_addr = device.data[i].stop_addr;
			device.data[i - 1].duration = parseInt((new Date(device.data[i].end_time).getTime() - new Date(device.data[i - 1].start_time).getTime()) / 1000);
            device.data[i - 1].idle_duration =(device.data[i - 1].idle_duration|| 0) + ( device.data[i].idle_duration || 0);
            device.data[i - 1].distance = (device.data[i - 1].distance || 0) + (device.data[i].distance || 0);
            if(device.data[i].googleaddr) {
				device.data[i - 1].start_addr = device.data[i].start_addr;
				device.data[i - 1].googleaddr = true;
			}
			//copy points from removable ADAS to prev ADAS
            if(device.data[i-1].points && device.data[i-1].points.length){
            	if(device.data[i].points && device.data[i].points.length){
            		device.data[i-1].points = device.data[i-1].points.concat(device.data[i].points);
            	}
            }else if(device.data[i].points && device.data[i].points.length){
            	device.data[i-1].points = device.data[i].points;
            }
			device.data.splice(i, 1);
			i--;
		}
		resolve();
	});
}

// clubs drive-stop-drive to drive
function clubDrivesAndStops(device) {
	return new Promise((resolve, reject) => {
		for (let i = 2; i < device.data.length; i++) {
			if (!device.data[i - 2].drive) continue;
			if (device.data[i - 1].drive) continue;
			if (!device.data[i].drive) continue;
            //don't club id idle situation occurs
		    if (device.data[i - 2].idle || device.data[i - 1].idle || device.data[i].idle) continue;
            if (device.data[i - 1].duration > 180) continue;

			if ((new Date(device.data[i - 2].end_time).getTime() - new Date(device.data[i - 1].start_time).getTime()) > 3 * 60 * 1000) continue;
			if ((new Date(device.data[i - 1].end_time).getTime() - new Date(device.data[i].start_time).getTime()) > 3 * 60 * 1000) continue;


			device.data[i - 2].end_time = device.data[i].end_time;
			device.data[i - 2].stop = device.data[i].stop;
			device.data[i - 2].stop_addr = device.data[i].stop_addr;

			device.data[i - 2].duration = parseInt((new Date(device.data[i].end_time).getTime() - new Date(device.data[i - 2].start_time).getTime()) / 1000);
			device.data[i - 2].distance += device.data[i].distance;
			device.data.splice(i - 1, 2);
			i--;
		}
		resolve();
	});
}

function removeUnrealisticSpeeds(adas) {
	return new Promise((resolve, reject) => {
		for (let i = 0; i < adas.length; i++) {
			if (adas[i].distance / adas[i].duration * 3.6 > 150) {
				adas.splice(i, 1);
				i--;
			}
		}
		resolve();
	});
}

function predictOfflineDistance(adas){
	return new Promise((resolve, reject) => {
		for(let i = 1; i < adas.length; i++){
			//if (new Date(adas[i].start_time).getDate() !== new Date(adas[i - 1].start_time).getDate()) continue;
			let dur = dateutils.getSecs(adas[i].start_time) - dateutils.getSecs(adas[i-1].end_time);
			if(dur > 5){
				let prediction = {};
                prediction.pr = true;
				prediction.start_time = adas[i-1].end_time;
				prediction.end_time = adas[i].start_time;
				prediction.imei = adas[i].imei;
				prediction.start = adas[i-1].stop;
				prediction.stop = adas[i].start;
				if(!prediction.start || !prediction.stop) continue;
				prediction.distance = geozoneCalculator.getDistance(prediction.start, prediction.stop);
				prediction.duration = dur;
				prediction.idle_duration = 0;
				prediction.idle = false;
				prediction.top_speed = 0;
                if((prediction.distance/dur*3.6) > 90){
                    prediction.drive = false;
                    prediction.distance = 0;
                }else if(prediction.distance >100 && prediction.distance/dur*3.6 >3){
                    prediction.drive = true;
                }else{
                    prediction.drive = false;
                    //prediction.distance = 0;
                }
				prediction.status = prediction.drive ? 'running' : 'stopped';
				adas.splice(i, 0, prediction);
				i++;
			}
		}
		resolve();
	});

}

exports.processADASReportAsync = (data) => {
	return new Promise((resolve, reject) => {
		exports.processADASReport(data, (err, res) => {
			if(err) return reject(err);
			resolve(res);
		});
	});
};

exports.processADASReport = function(data, callback) {
    for (let i = 0; i < data.length; i++) {
		if(!data[i].drive && (data[i].distance/data[i].duration*3.6) > 10) {
		    data[i].drive = true;
        }
        if(data.idle === undefined) continue;
        data[i].idle_duration = data[i].idle ? data[i].duration : 0;
        delete data[i].idle;
    }

    let devices = {};

    for (let i = 0; i < data.length; i++) {
        if (!devices[data[i].imei]) {
            devices[data[i].imei] = {
                data: []
            };
        }
        devices[data[i].imei].data.push(data[i]);
    }

	async.each(devices, (device, done) => {
		device.data.sort((a, b) => {
            let keyA = new Date(a.start_time),
                keyB = new Date(b.start_time);
            // Compare the 2 dates
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
            return 0;
        });

		removeUnrealisticSpeeds(device.data)
		.then(() => predictOfflineDistance(device.data))
		.then(() => combineADASData(device))
		.then(() => clubDrivesAndStops(device))
		.then(() => combineADASData(device))
		.then(() => {
			for (let i = 0; i < device.data.length; i++) {
	            device.data[i].status = device.data[i].drive ? 'running' : (device.data[i].idle_duration / device.data[i].duration) > 0.7 ? 'idle' : 'stopped';
	        }

	        let dist = 0;
	        let num_idle = 0;
	        let num_stops = 0;
	        let dur_stop = 0;
	        let dur_total = 0;
	        let dur_idle = 0;
	        let topSpeed = 0;
	        let datewiseDistance = [];
	        for (let key in device.data) {
	            if (!datewiseDistance[dateutils.getDDMMYYYY(device.data[key].start_time)]) {
	                datewiseDistance[dateutils.getDDMMYYYY(device.data[key].start_time)] = 0;
	            }
	            datewiseDistance[dateutils.getDDMMYYYY(device.data[key].start_time)] += device.data[key].distance;
	            if (topSpeed < device.data[key].top_speed && device.data[key].top_speed < 90) {
	                topSpeed = device.data[key].top_speed;
	            }
	            dist += device.data[key].distance;
	            if (!device.data[key].drive) {
	                if (device.data[key].status === 'idle') {
	                    num_idle++;
	                }
	                dur_idle += device.data[key].idle_duration;
	                num_stops++;
	                dur_stop += device.data[key].duration;
	            } else {
	                device.data[key].average_speed = ((device.data[key].distance / device.data[key].duration) * 3.6).toFixed(2);
	            }
	            dur_total += device.data[key].duration;
	        }
	        device.top_speed = topSpeed;
	        device.num_stops = num_stops;
	        device.num_idle = num_idle;
	        device.avg_speed_w_stops = ((dist / dur_total) * 3.6).toFixed(2);
	        device.avg_speed_wo_stops = ((dist / (dur_total - dur_stop)) * 3.6).toFixed(2);
	        device.tot_dist = dist;
	        device.datewise_dist = [];
	        for (let key in datewiseDistance) {
	            device.datewise_dist.push({
	                date: key,
	                dist: datewiseDistance[key]
	            });
	        }
	        device.dur_total = dur_total;
	        device.dur_idle = dur_idle || 0;
	        device.dur_stop = dur_stop;
	        device.dur_wo_stop = dur_total - dur_stop;
	        device.engine_hours = dur_total - dur_stop + device.dur_idle;
			//done();
		}).then(function () {
           // if (options && options.isAddrReqd){
                return BPromise.promisify(fillAddressIfRequired)(device);
            //}
        }).then(function () {
            done();
        });
	}, function(err){
	    if(err){
            winston.error(err.toString());
        }
		callback(null, devices);
	});
};
function fillAddressIfRequired(adas, callback) {
    async.eachSeries(adas.data, function (datum, done) {
        Promise.resolve()
            .then(function () {
                if (datum.start_addr) return BPromise.resolve(datum.start_addr);
                if(!datum.start || !datum.start.latitude) return BPromise.resolve(" ");
                return addressService.getAddressFromGeographyAsync(datum.start.latitude, datum.start.longitude);
            })
            .then(function (addr) {
                datum.start_addr = addr;
            })
            .then(function () {
                if (datum.stop_addr || !datum.stop) return BPromise.resolve(datum.stop_addr);
                return addressService.getAddressFromGeographyAsync(datum.stop.latitude, datum.stop.longitude);
            })
            .then(function (addr) {
                datum.stop_addr = addr;
                done();
            }).catch(err => {
               done();
        });
    }, function (err) {
        callback(null, true);
    });
};

function fillLandmarkIfRequired(adas, callback) {
    async.eachSeries(adas.data, function (datum, done) {
        Promise.resolve()
            .then(function () {
                if (datum.landmark) return BPromise.resolve(datum);
                if(!datum.drive){
                    let oQuery = {location:datum.start,user_id:adas.user_id,no_of_docs:1,projection:{name:1,location:1},radius:2};
                    return addressService.getLandmarkFromGeographyAsync(oQuery);
                }else{
                    return {};
                }
            })
            .then(function (lm) {
                if(lm && lm.name){
                    let distLand = geozoneCalculator.getDistance(datum.start,lm.location);
                    datum.ldist = distLand || 0; //in KM
                    datum.landmark = lm && lm.name;
                    datum.lmark = lm && lm.location;
                }
                done();
            })
            .catch(err => {
            done();
        });
    }, function (err) {
        callback(null, true);
    });
};


exports.processADASReportV2Async = (data) => {
    return new Promise((resolve, reject) => {
        exports.processADASReportV2(data, (err, res) => {
        if(err) return reject(err);
    resolve(res);
});
});
};

exports.processADASReportV2Async = (data) => {
    return new Promise((resolve, reject) => {
        exports.processADASReportV2(data, (err, res) => {
        if(err) return reject(err);
    resolve(res);
});
});
};

exports.processADASReportV2 = function(data, callback) {
    for (let i = 0; i < data.length; i++) {
        if (!data[i].drive && data[i].distance > 200 && (data[i].distance / data[i].duration * 3.6) > 10) {
            data[i].drive = true;
        }else if(data[i].drive && (data[i].distance < 200 || (data[i].distance / data[i].duration * 3.6) < 3)){
            data[i].drive = false;
            //data[i].distance = 0;
        }
    }

    let devices = {};
    for (let i = 0; i < data.length; i++) {
        if (!devices[data[i].imei]) {
            devices[data[i].imei] = {
                data: []
            };
        }
        devices[data[i].imei].imei = allDevices[data[i].imei] && allDevices[data[i].imei].imei;
        devices[data[i].imei].reg_no = allDevices[data[i].imei] && allDevices[data[i].imei].reg_no;
        devices[data[i].imei].user_id = allDevices[data[i].imei] && allDevices[data[i].imei].user_id;
        devices[data[i].imei].data.push(data[i]);
    }

    async.each(devices, (device, done) => {
        device.data.sort((a, b) => {
        let keyA = new Date(a.start_time),
        keyB = new Date(b.start_time);
    // Compare the 2 dates
    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;
    return 0;
});
        predictOfflineDistance(device.data)
.then(() => combineADASData(device))
.then(() => clubDrivesAndStops(device))
.then(() => combineADASData(device))
.then(() => {
        for (let i = 0; i < device.data.length; i++) {
           device.data[i].status = device.data[i].drive ? 'running' : (device.data[i].idle_duration / device.data[i].duration) > 0.7 ? 'idle' : 'stopped';
         }

    let dist = 0;
    let num_idle = 0;
    let num_stops = 0;
    let dur_stop = 0;
    let dur_total = 0;
    let dur_idle = 0;
    let topSpeed = 0;
    let datewiseDistance = [];
    for (let key in device.data) {
        if (!datewiseDistance[dateutils.getDDMMYYYY(device.data[key].start_time)]) {
            datewiseDistance[dateutils.getDDMMYYYY(device.data[key].start_time)] = 0;
        }
        datewiseDistance[dateutils.getDDMMYYYY(device.data[key].start_time)] += device.data[key].distance;
        if (topSpeed < device.data[key].top_speed && device.data[key].top_speed < 90) {
            topSpeed = device.data[key].top_speed;
        }
        dist += device.data[key].distance;
        if (!device.data[key].drive) {
            if (device.data[key].status === 'idle') {
                num_idle++;
            }
            dur_idle += device.data[key].idle_duration;
            num_stops++;
            dur_stop += device.data[key].duration;
        } else {
            device.data[key].average_speed = ((device.data[key].distance / device.data[key].duration) * 3.6).toFixed(2);
        }
        dur_total += device.data[key].duration;
    }
    device.top_speed = topSpeed;
    device.num_stops = num_stops;
    device.num_idle = num_idle;
    device.avg_speed_w_stops = ((dist / dur_total) * 3.6).toFixed(2);
    device.avg_speed_wo_stops = ((dist / (dur_total - dur_stop)) * 3.6).toFixed(2);
    device.tot_dist = dist;
    device.datewise_dist = [];
    for (let key in datewiseDistance) {
        device.datewise_dist.push({
            date: key,
            dist: datewiseDistance[key]
        });
    }
    device.dur_total = dur_total;
    device.dur_idle = dur_idle || 0;
    device.dur_stop = dur_stop;
    device.dur_wo_stop = dur_total - dur_stop;
    device.engine_hours = dur_total - dur_stop + device.dur_idle;

    done();
   });
   /*
    }).then(function () {
            // if (options && options.isAddrReqd){
            return BPromise.promisify(fillAddressIfRequired)(device);
            //}
    }).then(function () {
            // if (options && options.isAddrReqd){
            if(device.user_id == 'kd'){
                return BPromise.promisify(fillLandmarkIfRequired)(device);
            }else{
                return;
            }
    }).then(function () {
            done();
    });
    */
}, function(err){
        callback(null, devices);
    });
};

exports.processADASReportV2ForDeviceAsync = (data) => {
    return new Promise((resolve, reject) => {
        exports.processADASReportV2ForDevice(data, (err, res) => {
            if(err) return reject(err);
            resolve(res);
        });
    });
};

exports.processADASReportV2ForDevice = function(data, callback) {
    for (let i = 0; i < data.length; i++) {
        if (!data[i].drive && data[i].distance > 200 && (data[i].distance / data[i].duration * 3.6) > 10) {
            data[i].drive = true;
        }else if(data[i].drive && (data[i].distance < 200 || (data[i].distance / data[i].duration * 3.6) < 3)){
            data[i].drive = false;
            //data[i].distance = 0;
        }
        if(data.idle === undefined) continue;
        data[i].idle_duration = data[i].idle ? data[i].duration : 0;
        delete data[i].idle;
    }
    let device = {data:data,imei:data[0].imei};
    predictOfflineDistance(device.data)
        .then(() => combineADASData(device))
        .then(() => clubDrivesAndStops(device))
        .then(() => combineADASData(device))
        .then(() => {
            callback(null, device);
        });
 };
