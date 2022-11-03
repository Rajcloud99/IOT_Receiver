const deviceService = require('./deviceService');
const allowedFieldsForUpdate = ['notif_id', 'notif_created_at', 'last_location_time', 'last_received_time', 'last_modified', 'enabled', 'status_name', 'entry', 'exit', 'in_status', 'out_status', 'location_buffer', 'is_inside'];
const cassandraDbInstance = require('../utils/cassandraDBInstance');
const database = require('../config').database;
const winston = require('../utils/logger');

const prepareUpdateQuery = function (oAlarm) {
	let sQuery = "",
		aParam = [],
		oRet = {};
	for (let key in oAlarm) {
		if (allowedFieldsForUpdate.indexOf(key) > -1) {
			aParam.push(oAlarm[key]);
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
};

exports.updateAlarm = function (oUpdate, callback) {
	oUpdate.last_modified = Date.now();
	const oQueryParam = prepareUpdateQuery(oUpdate);
	let sQuery = oQueryParam.sQuery;
	const aParam = oQueryParam.aParam;
	sQuery = 'UPDATE ' + database.table_Alarm + ' SET ' + sQuery + ' WHERE user_id = ? AND created_at = ?';
	aParam.push(oUpdate.user_id);
	aParam.push(oUpdate.created_at);
	// winston.info('updateAlarm',sQuery,aParam);
	cassandraDbInstance.execute(sQuery, aParam, {
		prepare: true
	}, function (err, result) {
		if (err) {
			callback(err, null);
			winston.error(err);
			return;
		}
		if (!result) {
			return callback(err, null);
		}
		return callback(err, oUpdate);
	});
};

exports.updateDeviceInventory = function (oAlarm, oPing, cb_update) {
	const oDevice = {};
	oDevice.imei = oPing.imei;
	oDevice.geofence_status = {};
	oDevice.geofence_status.name = oAlarm.name;
	oDevice.geofence_status.message = oAlarm.message;
	oDevice.geofence_status.category = oAlarm.category;
	oDevice.geofence_status.datetime = oPing.datetime;
	oDevice.geofence_status.lat = oPing.lat;
	oDevice.geofence_status.lng = oPing.lng;
	oDevice.geofence_status.course = oPing.course;
	deviceService.updateDeviceInventory(oDevice, cb_update);
};

exports.getAlarmForDeviceAsync = (imei) => {
	return new Promise((resolve, reject) => {
		exports.getAlarmForDevice(imei, (err, res) => {
			if (err) return reject(err);
			resolve(res);
		});
	});
};

exports.getAlarmForDevice = function (imei, callback) {
	//fetch alarm based on  schedule
	const oConfig = {
		prepare: 1
	};
	//const query = 'SELECT  * FROM ' + database.table_Alarm + ' WHERE imei = ? AND enabled = ? ALLOW FILTERING';
    const query = 'SELECT  * FROM ' + database.table_Alarm + ' WHERE imei = ? ALLOW FILTERING';
    const aParams = [imei];
	let enabledOnly = [];
	cassandraDbInstance.execute(query, aParams, oConfig, function (err, result) {
		if (err) return callback(err);
		if (!result.rows || result.rows.length <= 0) return callback(new Error('no alarms'));
		for(let i=0;i<result.rows.length;i++){
		    if(result.rows[i].enabled == 1){
		        enabledOnly.push(result.rows[i]);
            }
        }
		callback(null, enabledOnly);
	});
};

exports.generateMessage = (oAlarm, entry) => {
	if (entry) {
		if (oAlarm.category === 'loading') {
			oAlarm.message = oAlarm.entry_msg || "Wait for load";
			oAlarm.message = oAlarm.message + " at " + oAlarm.name;
		} else if (oAlarm.category === 'unloading') {
			oAlarm.message = oAlarm.entry_msg || "Wait for unload";
			oAlarm.message = oAlarm.message + " at " + oAlarm.name;
		} else if (oAlarm.category === 'alert') {
			oAlarm.message = oAlarm.entry_msg || "has entered into geofence ";
			if(oAlarm.name && oAlarm.name.length < 45){
                oAlarm.message = oAlarm.message + " at " + oAlarm.name;
			}
		} else {
			oAlarm.message = "has entered into geofence " + oAlarm.name;
		}
	} else {
		if (oAlarm.category === 'loading') {
			oAlarm.message = oAlarm.exit_msg || "Loaded";
			oAlarm.message = oAlarm.message + " at " + oAlarm.name;
		} else if (oAlarm.category === 'unloading') {
			oAlarm.message = oAlarm.exit_msg || "Unloaded";
			oAlarm.message = oAlarm.message + " at " + oAlarm.name;
		} else if (oAlarm.category === 'alert') {
			oAlarm.message = oAlarm.exit_msg || "has exited from geofence";
			if(oAlarm.name && oAlarm.name.length < 45){
                oAlarm.message = oAlarm.message + " at " + oAlarm.name;
            }
		} else {
			oAlarm.message = "has exited from geofence " + oAlarm.name;
		}
	}
	/*
    if(oAlarm.message.search(oAlarm.vehicle_no)===-1){
        oAlarm.message = oAlarm.vehicle_no + ' : ' + oAlarm.message;
    }
	 */
};

function prepareAlert(alarm_data) {
	const newNotification = {};
	newNotification.imei = alarm_data.device_id || alarm_data.imei;
	newNotification.type = alarm_data.code ? alarm_data.code : "";
	newNotification.vehicle_no = alarm_data.vehicle_no;
	newNotification.priority = 1;
	newNotification.severity = 'danger';
	newNotification.datetime = alarm_data.date;
	newNotification.device_type = alarm_data.device_type;
	newNotification.user_id = alarm_data.user_id;
	if(alarm_data.model_name == 'gt300'){

	}else if (alarm_data.msg) {
		newNotification.message = alarm_data.msg;
	} else {
		newNotification.message = "Alarm for " + alarm_data.vehicle_no;
	}
	if(alarm_data.location && alarm_data.location.address){
        newNotification.message = newNotification.message + " at " + alarm_data.location.address;
	}
	newNotification.content = newNotification.message;
    newNotification.title = newNotification.type + " alert for "+ alarm_data.vehicle_no;
	return newNotification;
}

exports.getAlarm = function (oFilter, callback) {
	if(!oFilter || !oFilter.atype){
		return;
	}
	const oConfig = {prepare: 1};
	const query = 'SELECT  user_id,aid,atype,enabled,imei,vehicle_no FROM ' + database.table_Alarm + ' WHERE atype = ? AND enabled = 1 LIMIT 10 ALLOW FILTERING';
	const aParams = [oFilter.atype];
	cassandraDbInstance.execute(query, aParams, oConfig, function (err, result) {
		if (err) return callback(err);
		if (!result.rows || result.rows.length <= 0) return callback(new Error('no alarms'));
		callback(null, result.rows);
	});
};

exports.getAlarmAsync = (oFilter) => {
	return new Promise((resolve, reject) => {
		exports.getAlarm(oFilter, (err, res) => {
			if (err) return reject(err);
			return resolve(res);
		});
	});
};

function cbAl(error,resp){
	if(error) console.log('cbAl alert dispatch error' + error);
}

