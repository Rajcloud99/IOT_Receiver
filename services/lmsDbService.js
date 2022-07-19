const lms = require('../config').lms;
const winston = require('../utils/logger');
const request = require('request');
winston.info("enable lms service : ", lms.lmsService,lms.host +":"+ lms.port);
const tbs = require('../services/telegramBotService');
let options = {
    method: 'POST',
    url:  "http://"+lms.host+":"+lms.port+"/api/gpsIntegration/getGeofences",
    headers:
        {
            'content-type': 'application/json'
        },
    body:
        {
            "server_intercommunication_key":lms.server_intercommunication_key,
        },
    json: true
};
module.exports.getGeofencesAsync = function(device_id) {
    return new Promise((resolve, reject) => {
        getGeofences(device_id, (err, res) => {
            if (err) return reject(err);
            resolve(res);
        });
    });
};
function getGeofences(device_id,callback) {
    options.body.device_id = device_id;
    if (lms.lmsService) {
        request.post(options, function(error,response,body){
            if (error) {
                winston.error("lms  getGeofences error " + error.toString());
                if(callback) callback(error,response);
            } else if(response && callback){
                callback(error,body.data);
            }

        });
    }else{
        //winston.info('lmsService  disabled');
    }
    return 1;
};
module.exports.updateGrGeofences = function(l_id,oUpdate,callback) {
    tbs.sendMessage(l_id + " update geofence");
    options.url = "http://"+lms.host+":"+lms.port+"/api/gpsIntegration/updateGrGeofence";
        options.body.l_id = l_id;
        options.body.modified = oUpdate;
            if (lms.lmsService) {
                request.post(options, function(error,response,body){
                    if (error) {
                        winston.error("lms  updateGrGeofences error " + error.toString());
                        if(callback) callback(error,response);
                    } else if(response && callback){
                        console.log(l_id + " update geofence success");
                        callback(error,response);
                    }else{
                        return;
                    }
                });
            }else{
                winston.info('lmsService  disabled');
            }
            return 1;
};

module.exports.updateTripGeofences = function(l_id,oUpdate,callback) {
    console.log('update Trip geofence');
    options.url = "http://"+lms.host+":"+lms.port+"/api/gpsIntegration/updateTripGeofence";
    options.body.l_id = l_id;
    options.body.modified = oUpdate;
    if (lms.lmsService) {
        request.post(options, function(error,response,body){
            if (error) {
                tbs.sendMessage(error.message + " lms  updateTripGeofences error");
                winston.error("lms  updateTripGeofences error " + error.toString());
                if(callback) callback(error,response);
            } else{
                console.log('updateTripGeofences resp check' ,body);
                if(callback) callback(error,body);
            }
        });
    }else{
        winston.info('lmsService  disabled');
    }
    return 1;
};
function cb(error,resp){
    winston.info(error);
}

//getGeofences(18527936239,cb);
//let modified = {is_inside:true};
//module.exports.updateGrGeofences('5b71b3ce83f686100eedb524',modified,cb);
