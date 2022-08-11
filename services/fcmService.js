const dateutils = require('../utils/dateutils');
const deviceService = require('./deviceService');
const notificationUtil = require('../utils/notification-util');
const winston = require('../utils/logger');
const smsService = require('./smsService');
const tbs = require('../services/telegramBotService');

const prepareFcmNotification = function (oNotif, oPing, aFCM_ids) {
	// winston.info(oPing);
	return {
		"registration_ids": aFCM_ids,
		"notification": {
			"title": oNotif.title || oNotif.type,
			"body": oNotif.message
		},
		"data": {
			"vehicle": oNotif.vehicle_no || oNotif.imei.toString(),
			"imei": oNotif.imei.toString(),
			"severity": "normal",
			"latitude": oPing && oPing.lat ? oPing.lat.toString() : '0',
			"longitude": oPing && oPing.lng ? oPing.lng.toString() : '0',
			"course": oPing && oPing.course ? oPing.course.toString() : '0',
			"speed": oPing && oPing.speed ? oPing.speed.toString() : '0',
			"datetime": oPing && oPing.datetime ? oPing.datetime.toString() : "",
			"acc": oPing && oPing.acc_high ? oPing.acc_high.toString() : ""
		}
	};
};

const comparePreferences = function (aMobile_FCM, dn_resp, sAlertType) {
	let aFcm_keys = [];
	for (let i = 0; i < aMobile_FCM.length; i++) {
		aMobile_FCM[i].sendNotification = true;
		for (let k = 0; k < dn_resp.length; k++) {
			if (aMobile_FCM[i].mobile_imei === dn_resp[k].mobile_imei && !dn_resp[k][sAlertType]) {
				aMobile_FCM[i].sendNotification = false;
			}
		}
	}
	for (let i = 0; i < aMobile_FCM.length; i++) {
		if (aMobile_FCM[i].sendNotification) {
			aFcm_keys.push(aMobile_FCM[i].fcm_key);
		}
	}
	if(aFcm_keys.length>3){
		let newFcmKeys = [];
		newFcmKeys.push(aFcm_keys[aFcm_keys.length-1]);
		newFcmKeys.push(aFcm_keys[aFcm_keys.length-2]);
		newFcmKeys.push(aFcm_keys[aFcm_keys.length-3]);
		aFcm_keys = newFcmKeys;
	}
	return aFcm_keys;
};

module.exports.sendFCMNotification = function (oNotif, oPing, callback) {

	if (!oNotif.user_id) return callback('no user_id');
	const aFCM_ids = [], aMobile_imeis = [], aMobile_FCM = [];
	deviceService.getMobileDevicesByUserIdAsync(oNotif.user_id).then(d_resp => {
		if (!d_resp || d_resp.length <= 0) throw new Error('no mobile devs');
		for (let i = 0; i < d_resp.length; i++) {
			if (d_resp[i].notification) {
				aMobile_imeis.push(d_resp[i].imei);
				aMobile_FCM.push({mobile_imei: d_resp[i].imei, fcm_key: d_resp[i].fcm_key});
			}
		}
		if (aMobile_imeis.length <= 0) throw new Error('no mobile imeis');
		// check for each mobile imie if device level alert is on

		return deviceService.getDeviceNotificationSettingsAsync(oNotif.imei, aMobile_imeis.join(","));
	}).then(dn_resp => {
		const aFCM_ids = comparePreferences(aMobile_FCM, dn_resp, oNotif.type);
		if (oPing && aFCM_ids.length <= 0) throw new Error('no fcm ids');
		const oFCMNotif = prepareFcmNotification(oNotif, oPing, aFCM_ids);

		notificationUtil.sendFCMNotification(oFCMNotif, callback);
	}).catch(err => {
		//winston.error('sendFCMNotification catch err ', err);
		callback(err);
	});
};

module.exports.sendFCMNotifAlerts = function (oAlert, aUsers, oPing) {
	let aIMEIs = [], sIMEIs = "";
	for (let dev = 0; dev < aUsers.length; dev++) {
		if (aUsers[dev].mobile_imeis && aUsers[dev].mobile_imeis.length > 0) {
			for (let k = 0; k < aUsers[dev].mobile_imeis.length; k++) {
				aIMEIs.push("'" + aUsers[dev].mobile_imeis[k] + "'");
			}
		}
	}
	sIMEIs = aIMEIs.join(",");
	const aFCM_ids = [], aMobile_imeis = [], aMobile_FCM = [];
	deviceService.getMobileDevicesAsync(sIMEIs).then(d_resp => {
		if (d_resp && d_resp.length <= 0) throw new Error('getMobileDevicesAsync error');
		for (let i = 0; i < d_resp.length; i++) {
			if (d_resp[i].notification) {
				aMobile_imeis.push("'" + d_resp[i].imei + "'");
				aMobile_FCM.push({mobile_imei: d_resp[i].imei, fcm_key: d_resp[i].fcm_key});
			}
		}
		if (aMobile_imeis.length <= 0) throw new Error('getMobileDevicesAsync error2');
		// check for each mobile imie if device level alert is on
		return deviceService.getDeviceNotificationSettingsAsync(oAlert.imei, aMobile_imeis.join(","));
	}).then(dn_resp => {
		const aFCM_ids = comparePreferences(aMobile_FCM, dn_resp, oAlert.type);
		if (aFCM_ids.length > 0) throw new Error('getDeviceNotificationSettingsAsync err');
		const oFCMNotif = prepareFcmNotification(oAlert, oPing, aFCM_ids);
		notificationUtil.sendFCMNotification(oFCMNotif,function(){
			//jdut pass a cb
		});
	}).catch(err => {
	});
};

module.exports.sendSMSNotification = function (oNotif, callback) {
    let user_id = oNotif.user_id ? oNotif.user_id.toLowerCase():null;
    if(user_id && (user_id.search('sccdelhi') > -1 || user_id.search('ravikashyap') > -1) && oNotif.message && oNotif.mobiles && oNotif.mobiles.length>0){
        tbs.sendMessage(' SMS initiated for '+ oNotif.vehicle_no + ' '  +oNotif.message);
        //smsService.sendSMS(oNotif.mobiles.join(','),oNotif.message,callback);
	}else{
       ///console.log('sms to user '+ oNotif.user_id);
	}
};
