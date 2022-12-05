let axios = require ('axios');
const config = require('../config');
let oSigPayload = {
    method: 'post',
    url: config.oneSignal && config.oneSignal.url,
    headers: {
        'Authorization': config.oneSignal && config.oneSignal.token,
        'Accept': 'application/jso',
        'Content-Type': 'application/json'
    }
};
let cb = function(err,resp){
    if(err){
        console.log('oneSignal data for mmp failed');
    }else{
        console.log('oneSignal post done without error');
    }
};

exports.sendOneSignalNotification = function(oNotif,callback){
    oSigPayload.data = JSON.parse(JSON.stringify(oNotif));
    oSigPayload.data.app_id = config.oneSignal && config.oneSignal.app_id;
    axios(oSigPayload)
        .then(function (response,rest) {
            if(callback){
                callback(null,response);
            }

        }).catch(function (err) {
            console.error(' error in sendOneSignalNotification',err);
        if(callback){
            callback(err);
        }

    });
}

let oData = {
    "include_external_user_ids": [
        "WCPL"
    ],
    "contents": {
        "en": "App update notification",
        "es": "ES on API"
    },
    "data": {
        "foo": "bar"
    },
    "name": "App update"
};
//exports.sendOneSignalNotification(oData,cb);

