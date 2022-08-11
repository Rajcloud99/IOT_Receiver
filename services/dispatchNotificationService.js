const notification = require('../config').notification;
const winston = require('../utils/logger');
const request = require('request');
winston.info("enable sms : ", notification.dispatchNotifEnable);
const tbs = require('../services/telegramBotService');
let options = {
    method: 'POST',
    url:  "http://"+notification.host+":"+notification.port+"/",
    headers:
        {
            'content-type': 'application/json'
        },
    body:
        {
            "server_intercommunication_key":notification.server_intercommunication_key,
            userIds: [ 'kamal' ],
            data: {
                content: 'We will follow the schedule below for the Thanksgiving holiday. Please take note. An X indicates you are working during that period (For this example, create a row of Thanksgiving holiday dates, a column of employee names, and mark an X in the cell when the employee should work).',
                title: 'test notif' }
                ,
            timeToLive: 220
        },
    json: true
};
module.exports.dispatchNotification = function(userIds, oNotification,callback) {
    options.body.userIds = userIds;
    options.body.data = oNotification.data;
    //console.log('notification.dispatchNotifEnable',notification.dispatchNotifEnable,options.body.userIds);
    if (notification.dispatchNotifEnable) {
        request.post(options, function(error,response,body){
            //console.log(response,body);
            if (error) {
                winston.error("dispatch notif error " + error.toString());
                tbs.sendMessage("dispatch notif error "+ error.message + error.toString() + oNotification.toString());
                if(callback) callback(error,response);
            } else if(response && callback){
                if(callback) callback(error,response);
            }

        });
    }else{
        winston.info('dispatch notification disabled');
    }
    return 1;
};
function cb(error,resp){
    winston.info(error);
}
//module.exports.dispatchNotification(['GPSDEMO'],options.body,cb);