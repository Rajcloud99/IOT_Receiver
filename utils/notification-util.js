const winston = require('./logger');
const FCM = require('fcm-node');
const database = require('../config').database;
winston.info("FCM notification Enabled", database.fcmEnabled);
const tbs = require('../services/telegramBotService');
exports.sendFCMNotification = function (oNotification, callback) {
	const message = {
		registration_ids: oNotification.registration_ids,
		//collapseKey: 'demo',
		priority: oNotification.priority || 'high',
		//contentAvailable: oNotification.contentAvailable || true,
		//delayWhileIdle: oNotification.delayWhileIdle || true,
		timeToLive: oNotification.timeToLive || 108,
		//dryRun: true,
		data: oNotification.data,
		notification: oNotification.notification
	};
	const sender = new FCM(database.fcmServerKey);
	// Now the sender can be used to send messages
	// winston.info('fcm',oNotification);
	if (database.fcmEnabled) {
		sender.send(message, function (err, response) {
			if (err){
				console.error(err);
				return;// callback(err);
			}else{
				try{
					return callback(response);
				}catch(e){
					 tbs.sendMessage('fcmEnabled' + JSON.stringify(oNotification.notification) + " Err " + e.message);
				}
				
			}    
		});
	} else {
		callback('fcm notifications are disabled.');
	}
};
/*
 var oFCMNotif = {
 "notification": {
 "title": "Gefence Alert",
 "body": "KA03HQ4012 has entered in Kamal geozone."
 },
 "data": {
 "vehicle": "KA03HQ4012",
 "imei": 2131423424434343,
 "priority" : "low",
 "severity": "warning"
 },
 "registration_ids" : ["eSXbpnMKG5I:APA91bF_WYXKlMZk_oP1bR1aAbvP1O1uDf8SWc6PVbGxTLRt7ZKAQZdTfM7K_eDrBfrAV1IVZQZvqExak3NClA7rth3omOQv2r6sanUv1rdmb9pAKzLTXHq-2556-O-KpcvVPGL97Bgk"]
 };
 exports.sendFCMNotification(oFCMNotif,function(err,resp){
	 console.log(err,resp);
 });
*/
 
