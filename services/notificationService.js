const cassandraDbInstance = require('../utils/cassandraDBInstance');
const database = require('../config').database;
const winston = require('../utils/logger');
const dateutils = require('../utils/dateutils');
const tbs = require('../services/telegramBotService');
const allowedFieldsForCreate = ['entry', 'exit', 'mobiles', 'emails', 'nid', 'type', 'imei', 'datetime', 'message', 'priority', 'severity', 'user_id', 'vehicle_no','driver'];
const allowedFieldsForUpdate = ['exit'];
const prepareUpdateQuery = function (oAlarm) {
    let sQuery = "";
    const aParam = [],
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

const prepareCreateQuery = function (oAlarm) {
    let sQuery = "", sValues = "";
    const aParam = [], oRet = {};
    for (const key in oAlarm) {
        if (allowedFieldsForCreate.indexOf(key) > -1) {
            aParam.push(oAlarm[key]);
            if (sQuery) { // prevent ',' to append initially
                sQuery = sQuery + "," + key;
                sValues = sValues + ",?";
            } else {
                sQuery = key;
                sValues = "?";
            }
        }
    }
    oRet.sQuery = sQuery;
    oRet.sValues = sValues;
    oRet.aParam = aParam;
    return oRet;
};

module.exports.updateNotification = function (oUpdate, callback) {
    const oQueryParam = prepareUpdateQuery(oUpdate);
    let sQuery = oQueryParam.sQuery;
    const aParam = oQueryParam.aParam;
    sQuery = 'UPDATE ' + database.table_notification + ' SET ' + sQuery + ' WHERE user_id = ? AND datetime = ?';
    aParam.push(oUpdate.user_id);
    aParam.push(oUpdate.datetime);
    cassandraDbInstance.execute(sQuery, aParam, {
        prepare: true
    }, function (err, result) {
		// tbs.sendMessage('updateNotification err:', !!err ? 'true': 'false', JSON.stringify(oUpdate));
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

function saveNotification(request, callback) {
    request.nid = request.nid || "n_" + Date.now();
    request.datetime = Date.now();
    const oRet = prepareCreateQuery(request);
    const query = 'INSERT INTO ' + database.table_notification + ' (' + oRet.sQuery + ') VALUES(' + oRet.sValues + ')';
    cassandraDbInstance.execute(query, oRet.aParam,
        {prepare: true}, function (err, result) {
			// tbs.sendMessage('saveNotification err:', !!err ? 'true': 'false', JSON.stringify(request));
            if (err) {
                console.error(err.toString());
                return callback(err);
            }
            if (!result) {
                return callback(err, null);
            } else {
                if (request.mobiles && request.mobiles.length > 0) {
                    if (request.datetime) {
                        request.message = request.message + " Time : " + dateutils.getFormattedDateTime(request.datetime);
                    }
                    // if(request.type ==='over_speed' && request.sendSMS){
                    //smsService.sendSMS(request.mobiles,request.message);
                    // }else{
                    //smsService.sendSMS(request.mobiles,request.message);
                    // }
                }
            }
            return callback(err, request);
        });
}

const saveBulkNotification = function (alert_data, user_data, callback) {
    //console.log('in saveBulkNotifications');
    const aQueries = [], aMobiles = [], aEmails = [];
    for (let dev = 0; dev < user_data.length; dev++) {
        if (user_data[dev].mobile) {
            aMobiles.push(user_data[dev].mobile);
            alert_data.mobiles = [user_data[dev].mobile];
        }
        if (user_data[dev].email) {
            aEmails.push(user_data[dev].email);
            alert_data.emails = [user_data[dev].email];
        }
        alert_data.nid = "n_" + Date.now();
        alert_data.user_id = user_data[dev].user_id;
        alert_data.datetime = alert_data.date || Date.now();
        const oRet = prepareCreateQuery(alert_data);
        const sQuery = 'INSERT INTO ' + database.table_notification + ' (' + oRet.sQuery + ') VALUES(' + oRet.sValues + ')';
        aQueries.push({query: sQuery, params: oRet.aParam});
    }
    if (aQueries.length > 0) {
        cassandraDbInstance.batch(aQueries, {prepare: true}, function (err, result) {
            if (err) {
                callback(err, null);
                winston.error(err);
                return;
            }
            if (!result) {
                return callback(err, null);
            }
            if (aMobiles && aMobiles.length > 0) {
                if (alert_data.date) {
                    alert_data.message = alert_data.message + " Time : " + dateutils.getFormattedDateTime(alert_data.date);
                }
                // smsService.sendSMS(aMobiles,alert_data.message);
            }
            return callback(err, result);
        });
    }else{
        console.log('no queries to save notifs');
    }
};

module.exports.saveBulkNotification = saveBulkNotification;
module.exports.saveNotification = saveNotification;
