const geozoneCalculator = require('./geozoneCalculator');
const tripService = require('./tripService');
const notificationService = require('./notificationService');
const deviceService = require('./deviceService');
const fcmService = require('./fcmService');
const allowedFieldsForUpdate = ['notif_id', 'notif_created_at', 'last_location_time', 'last_received_time', 'last_modified', 'enabled', 'status_name', 'entry', 'exit', 'in_status', 'out_status', 'location_buffer', 'is_inside'];
const async = require('async');
const cassandraDbInstance = require('../utils/cassandraDBInstance');
const database = require('../config').database;
const winston = require('../utils/logger');
const socketServer = require('../servers/socketserver');
const tbs = require('../services/telegramBotService');
const dateUtils = require('../utils/dateutils');
const notificationDispService = require('../services/dispatchNotificationService');
const smsService = require('./smsService');
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

exports.updateSendFCMandSaveNotification = function (oAlarm, oPing, callback) {
	const newNotification = {};
	const oUpdateNotification = {};
	oUpdateNotification.alarm = JSON.parse(JSON.stringify(oAlarm));
	oUpdateNotification.nid = oAlarm.notif_id;
	oUpdateNotification.datetime = oAlarm.notif_created_at;
	oUpdateNotification.exit = {};
	oUpdateNotification.exit.message = oAlarm.message;
	oUpdateNotification.exit.datetime = oPing.datetime;
	oUpdateNotification.exit.lat = oPing.lat;
	oUpdateNotification.exit.lng = oPing.lng;
	oUpdateNotification.exit.course = oPing.course;
	oUpdateNotification.exit.category = oAlarm.category;
	oUpdateNotification.exit.name = oAlarm.name;
	oUpdateNotification.user_id = oAlarm.user_id;
	oUpdateNotification.alarm_created_at = oAlarm.created_at;
	newNotification.imei = oAlarm.imei;
	newNotification.type = oAlarm.atype;
	newNotification.vehicle_no = oAlarm.vehicle_no;
	newNotification.user_id = oAlarm.user_id;
	newNotification.priority = 2;
	newNotification.severity = 'normal';
	newNotification.message = oAlarm.message;
	newNotification.mobiles = oAlarm.mobiles;
	newNotification.emails = oAlarm.emails;
	newNotification.over_speed = oAlarm.over_speed;
	newNotification.sendSMS = oAlarm.sendSMS;
	newNotification.device_type = oAlarm.device_type;
	newNotification.notif_id = oAlarm.notif_id;
	async.parallel([
		async.reflect((cb1) => {
			console.log('updateSendFCMandSaveNotification');
			fcmService.sendFCMNotification(newNotification, oPing, cb1);
		}),
		async.reflect((cb) => {
			notificationService.updateNotification(oUpdateNotification, cb);
		})
	], callback);
	return newNotification;
};

exports.prepareSendFCMandSaveNotificationAsync = (oAlarm, oPing) => {
	return new Promise((resolve, reject) => {
		exports.prepareSendFCMandSaveNotification(oAlarm, oPing, (err, res) => {
			if (err) return reject(err);
			resolve(res);
		});
	});
};

exports.prepareSendFCMandSaveNotification = (oAlarm, oPing, callback) => {
    //console.log('prepareSendFCMandSaveNotification2');
	const newNotification = {};
	newNotification.alarm = JSON.parse(JSON.stringify(oAlarm));
	if (oAlarm.atype === 'geofence' && oPing.exit === false) {
		newNotification.entry = {};
		newNotification.entry.message = oAlarm.message;
		newNotification.entry.datetime = oPing.datetime;
		newNotification.entry.lat = oPing.lat;
		newNotification.entry.lng = oPing.lng;
		newNotification.entry.course = oPing.course;
		newNotification.entry.category = oAlarm.category;
		newNotification.entry.name = oAlarm.name;
	} else if (oAlarm.atype === 'geofence' && oPing.exit === true) {
		newNotification.exit = {};
		newNotification.exit.message = oAlarm.message;
		newNotification.exit.datetime = oPing.datetime;
		newNotification.exit.lat = oPing.lat;
		newNotification.exit.lng = oPing.lng;
		newNotification.exit.course = oPing.course;
		newNotification.exit.category = oAlarm.category;
		newNotification.exit.name = oAlarm.name;
	}
	newNotification.imei = oAlarm.imei;
	newNotification.type = oAlarm.atype;
	newNotification.vehicle_no = oAlarm.vehicle_no;
	newNotification.user_id = oAlarm.user_id;
	newNotification.priority = 2;
	newNotification.severity = 'normal';
	newNotification.message = oAlarm.message;
	newNotification.mobiles = oAlarm.mobiles;
	newNotification.emails = oAlarm.emails;
	newNotification.over_speed = oAlarm.over_speed;
	newNotification.sendSMS = oAlarm.sendSMS;
	newNotification.device_type = oAlarm.device_type;
    newNotification.nid = "n_" + Date.now();
    newNotification.title = newNotification.type +  " for " + newNotification.vehicle_no;
    newNotification.content  = newNotification.message;
	//TODO take text out for globalization and lang translation.
	//create custom message
    function cbb(err,resp){
        if(err){
            console.log('alarm service error',err,resp);
        }
    }
	/*
    if(newNotification.user_id){
        let oNotifAlert = {data:newNotification,userIds:[newNotification.user_id]};
        notificationDispService.dispatchNotification([newNotification.user_id],oNotifAlert,cbb);
    }
	*/
    /*
     consider 1 km geofence radius
     multiple entry ignored within 1 hr due to drift
     */
    var public_link;
    //console.log('prepareSendFCMandSaveNotification2');
    if(!oAlarm.last_received_time && oAlarm.atype == 'geofence'){
        //tbs.sendMessage(oAlarm.atype + "last received at " + oAlarm.last_received_time + " for user "+ oAlarm.user_id + "on vehicle " +oAlarm.vehicle_no);
		if(oAlarm.public_link){
            public_link = "http://tracking.gpsgaadi.com/%23!/sharedLocation/" + oAlarm.public_link;
            newNotification.message = newNotification.message  + " Current location "+ public_link;
		}
        fcmService.sendSMSNotification(newNotification,cbb);
    }else if(oAlarm.atype === 'geofence' && oAlarm.last_received_time && (Date.now() - new Date(oAlarm.last_received_time).getTime()) > 60 * 60 * 1000){
        if(oAlarm.public_link){
            public_link = "http://tracking.gpsgaadi.com/%23!/sharedLocation/" + oAlarm.public_link;
            newNotification.message = newNotification.message  + " Current location "+ public_link;
        }
        //tbs.sendMessage(oAlarm.atype + "last received at " + oAlarm.last_received_time + " for user "+ oAlarm.user_id + "on vehicle " +oAlarm.vehicle_no);
        fcmService.sendSMSNotification(newNotification,cbb);
    }else{
      	//console.log(' fake exit due to drif');
	}
   async.parallel([
		async.reflect((cb1) => {
			console.log('prepareSendFCMandSaveNotification');
			fcmService.sendFCMNotification(newNotification, oPing, cb1);
		}),
		async.reflect((cb) => {
			notificationService.saveNotification(newNotification, cb);
		})
	], callback);

	return newNotification;
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
		// tbs.sendMessage('updateAlarm err:', !!err ? 'true': 'false', JSON.stringify(oUpdate));
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

exports.sendAlerts = function (data, oPing) {
    const oReq = {};
	oReq.imei = data.imei;
	oReq.request = 'gpsgaadi_by_imei';
    oReq.aUsersIds = [];
	deviceService.getGpsgaadiAsync(oReq).then(function (gpsgaadis) {
    	if (gpsgaadis && gpsgaadis.length > 0) {
			const aUsersIds = [];
			const sos_nos = [];
			data.vehicle_no = gpsgaadis[0].reg_no;
			for (let k = 0; k < gpsgaadis.length; k++) {
				aUsersIds.push(gpsgaadis[k].user_id);
				if(data.code == 'sos' && gpsgaadis[k].sos_nos && gpsgaadis[k].sos_nos.length > 0){
				    for(let j=0;j<gpsgaadis[k].sos_nos.length;j++){
                        sos_nos.push(gpsgaadis[k].sos_nos[j]);
                        if(gpsgaadis[k].branch){
							data.branch = gpsgaadis[k].branch;
						}
                    }
            	}
			}
            oReq.aUsersIds = aUsersIds;
			oReq.sos_nos = sos_nos;
			return deviceService.getUsersAsync(aUsersIds);
		} else {
			throw new Error('gpsgaadi not found in alarmService');
		}
	}).then(function (users) {
        const alert = prepareAlert(data);
		//console.log('alert',alert);
        if (users && users.length > 0 && alert.type !== 'accident' && alert.type !== 'normal') {
			socketServer.sendAlertToAllSockets(JSON.parse(JSON.stringify(alert)), data.imei);
            
			if (alert.type !== 'accident' && alert.type !== 'normal' && alert.type != 'engine_on' && alert.type != 'engine_off' && alert.type != 'wire_disconnect' && alert.type != 'wire_disconnect'
				&& alert.type != 'power_cut' && alert.type != 'tempering' && alert.type != 'rt') {
				//fcmService.sendFCMNotifAlerts(alert, users, oPing);
				let addr = 'A'
				if(alert.user_id == 'GPSDEMO'){
					if(data.location && data.location.address){
						addr = data.location.address;
						console.log('data.location.addresss',data.location && data.location.address);
					}
				
					if(addr){
						addr = addr.toLowerCase();
						let aWords2 = addr.split(',');
						addr = aWords2.join('');
					}
					aDD = addr.split(' ');
					if(aDD.length> 4){
						addr = aDD[0] + " " + aDD[1]+ " " + aDD[2];
					}
				   //sms template from iskcon
					//let sSMS =  alert.title + " at " + addr + " ISKCON Dwarka Delhi";
					//sms template from gpsgaadi
					let sSMS =  alert.title + " at " + addr + " UMBRELLA PROTECTION SYSTEMS PVT LTD";
					console.log('sSMS for gps alerts',sSMS);
					let aMobile = [9820131263,9970328296];
					for(let m=0;m<aMobile.length;m++){
						smsService.sendSMS(aMobile[m],sSMS,cbAl);
					}
				  }
				//console.log('sendAlerts logsss');
				fcmService.sendFCMNotification(alert, oPing, function(err,resp){
					//console.log('sendFCMNotification logsss',err,resp);
				})
			}

			if(oReq.aUsersIds && oReq.aUsersIds.length){
				let oNotifAlert = {data:alert,userIds:oReq.aUsersIds};
                //notificationDispService.dispatchNotification(oReq.aUsersIds,oNotifAlert,cbAl);
            }
            if(oReq.sos_nos && oReq.sos_nos.length>0){
            	if(data.model_name == 'gt300'){
					alert.message = data.branch + "/" + data.vehicle_no + " Vibration Alarm!  "+ dateUtils.getYYYYMMDDHHMM(data.datetime)+" "+
						"http://maps.google.com/maps?q=N"+(data.location && data.location.lat)+",E"+(data.location && data.location.lng)+" "+(data.location && data.location.address);
					//tbs.sendMessage(alert.message);
				}

				if(data.model_name == 'gt300' && alert.type == 'sos'){
					if(data.location && data.location.address){
						addr = data.location.address;
						console.log('data.location.addresss gt300',data.location && data.location.address);
					}

					if(addr){
						addr = addr.toLowerCase();
						let aWords2 = addr.split(',');
						addr = aWords2.join('');
					}
					aDD = addr.split(' ');
					if(aDD.length> 4){
						addr = aDD[0] + " " + aDD[1]+ " " + aDD[2];
					}
					//sms template from iskcon
					//let sSMS =  alert.title + " at " + addr + " ISKCON Dwarka Delhi";
					//sms template from gpsgaadi
					let sSMS =  alert.title + " at " + addr + " UMBRELLA PROTECTION SYSTEMS PVT LTD";
					console.log('sSMS for gps alerts  gt300',sSMS);
					tbs.sendMessage("Initiated" +sSMS);
					let aMobile = oReq.sos_nos;
					for(let m=0;m<aMobile.length;m++){
						smsService.sendSMS(aMobile[m],sSMS,cbAl);
						tbs.sendMessage("Sent sms  gt300" +aMobile[m]);
					}
				}
               // smsService.sendSMS(oReq.sos_nos.join(','),alert.message,cbAl);
            }

			notificationService.saveBulkNotification(alert, users, (err, res) => {
				if (err) winston.error('notif_cb res:' + err);
			});
		}
	}).catch(function (err) {
	});
};

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
/*
let tempOAlarm = {
	atype:'geofence',
	category:'alert',
	message:"Test geofence notifications",
	name:"Test site",
	imei:862549045972232,
	vehicle_no:"MH04GR0463",
	user_id:"GPSDEMO",
	mobiles:[9535888738],
	device_type:'crx',
	type:'geofence',

};
let tempPing = {
	exit:false,
	datetime: "2021-04-03T09:59:00.000Z",
	address: "Testing Notofication service",
	course: 195,
	lat: 28.67796,
	lng: 77.10548666666666,
	speed: 0
}


exports.prepareSendFCMandSaveNotification(tempOAlarm, tempPing, function(err,resp){
  console.log(err,resp);
});
*/
