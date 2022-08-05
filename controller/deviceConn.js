/**
 * @Author: kamal
 * @Date:   2017-11-11
 */

const BPromise = require('bluebird');
const router = require('express').Router();
const async = BPromise.promisifyAll(require('async'));
const servers = require('../servers/servers');
const serverConfig = require('../config');
const cassandra = require('../utils/cassandra');
const socketServer = require('../servers/socketserver');
const telegramBotService = require('../services/telegramBotService');

router.post("/getDevice", function (req, res, next) {
    let device_id = req.body.device_id;
    const msg = {};
    let sendResp='';
    for (const key in serverConfig.servers) {
        if (!serverConfig.servers.hasOwnProperty(key)) continue;
        let conn = servers[key].getActiveConnections(device_id);
        if(conn && conn.alertSettings){
            sendResp = conn.alertSettings;
        }else{
            sendResp = 'no alert settings found';
        }
        console.log('conn' , conn);
        if(conn.connection) msg[device_id] = conn.connection.destroyed;
       }
    return res.status(200).json({'connections':msg,data :sendResp});
});
function connCallback(err,count){
   if(err){
       console.error('err',err.toString());
   }else{
       console.log(count);
   }
}
router.post("/getConnections", function (req, res, next) {
    //let device_id = req.body.device_id;
    const msg = {};
    let sendResp='';
    for (const key in serverConfig.servers) {
        if (!serverConfig.servers.hasOwnProperty(key)) continue;
        console.log('conn to ' , key);
        if(servers[key].server && servers[key].server.getConnections) servers[key].server.getConnections(connCallback);
    }
    return res.status(200).json({'msg':'ok'});
});

router.post("/getAllDevice", function (req, res, next) {
    let device_ids = req.body.device_ids;
    console.log(device_ids);
    const msg = {};
    let count = 0;
    let logCon = {};
    for (const key in serverConfig.servers) {
        if (!serverConfig.servers.hasOwnProperty(key)) continue;
        for(var i=0;i<device_ids.length;i++){
            let conn = servers[key].getActiveConnections(device_ids[i]);
            if(conn.connection){
                if(!msg[key]){
                    msg[key] = {'count':0};
                }
                if(!msg[key][device_ids[i]]){
                    msg[key][device_ids[i]] = {};
                }
                logCon = {};
                count++;
                msg[key].count++;
                msg[key][device_ids[i]].destroyed = conn.connection.destroyed;
                logCon.model_name = conn.model_name;
                logCon.port = conn.port;
                logCon.uid = conn.uid;
                logCon.user_id = conn.user_id;
                logCon.tripAlertSettings = conn.tripAlertSettings;
                logCon.alertSettings = conn.alertSettings;
                logCon.idle = conn.idle;
                logCon.dist_today = conn.dist_today;

                console.log('conn' , JSON.stringify(logCon));
            }
        }
    }
    return res.status(200).json({'connections':msg,'count':count,total:device_ids.length,tripAlertSettings:logCon.tripAlertSettings,dist_today:logCon.dist_today,user_id:logCon.user_id,alertSettings:logCon.alertSettings});
});

router.post("/sendCommand", function (req, res, next) {
    let device_id = req.body.device_id;
    let command = req.body.command;
    const msg = {};
    let sendResp='';
    console.log('request for ',command,device_id);
    for (const key in serverConfig.servers) {
        if (!serverConfig.servers.hasOwnProperty(key)) continue;
        let conn = servers[key].getActiveConnections(device_id);
        if(conn && conn.connection){

            conn.send(command);
            //conn.connection.write(command);
            console.log(command,device_id);
          }else{
            sendResp = 'no conn found';
        }
        if(conn.connection) msg[device_id] = conn.connection.destroyed;
    }
    return res.status(200).json({'connections':msg,data :sendResp});
});

router.post("/sendCommandV2", function (req, res, next) {
    let device_id = req.body.device_id;
    let command = req.body.command;
    const msg = {};
    let sendResp='';
    console.log('request for ',command,device_id);
    for (const key in serverConfig.servers) {
        if (!serverConfig.servers.hasOwnProperty(key)) continue;
        let conn = servers[key].getActiveConnections(device_id);
        if(conn && conn.connection){
            conn.adapter.sendCommand(req.body.type,req.body.param);
            //conn.adapter.send_command(command);
            //conn.send(command);
            //conn.connection.write(command);
            console.log(command,device_id);
        }else{
            sendResp = 'no conn found';
        }
        if(conn.connection) msg[device_id] = conn.connection.destroyed;
    }
    return res.status(200).json({'connections':msg,data :sendResp});
});

router.post("/getAllDeviceByUid", function (req, res, next) {
    let user_id = req.body.user_id;
    let user_devices;
    BPromise.promisify(cassandra.getGpsgaadiForUser)(user_id)
        .then(function (devices) {
            user_devices = devices;
            const imeis = [];
            for(let i=0;i<devices.length;i++){
                imeis.push(devices[i].imei);
            }
            return BPromise.promisify(cassandra.getDeviceByIMEIs)(imeis);
        }).then(function(device_ids){
        const msg = {};
        let deviated_devices = [];
        let count = 0,deviation=0;
        for (const key in serverConfig.servers) {
            if (!serverConfig.servers.hasOwnProperty(key)) continue;
            for(var i=0;i<device_ids.length;i++){
                let conn = servers[key].getActiveConnections(device_ids[i].imei);
                console.log('conn' , conn);
                if(conn.connection){
                    if(!msg[key]){
                        msg[key] = {'count':0,'deviation':0};
                    }
                    if(!msg[key][device_ids[i].imei]){
                        msg[key][device_ids[i].imei] = {};
                    }
                    count++;
                    msg[key].count++;
                    msg[key][device_ids[i].imei].destroyed = conn.connection.destroyed;
                    device_ids[i].destroyed = conn.connection.destroyed;
                    if(device_ids[i].status != 'online'){
                        msg[key][device_ids[i].imei].online = true;
                        device_ids[i].nstatus = 'online';
                        msg[key].deviation++;
                        deviation++;
                        deviated_devices.push(device_ids[i]);
                    }
                }
            }
        }
        return res.status(200).json({'connections':msg,'count':count,total:device_ids.length,ttotal:user_devices.length,deviation:deviation,users_devices:device_ids,deviated:deviated_devices});
         });
});

router.post("/sendAlert", function (req, res) {
    socketServer.sendAlertToAllSockets(req.body.alert, req.body.device_id);
    return res.status(200).json({'data':'sent'});
});

router.post("/updateTripAlerts", function (req, res) {
    if(!req.body.device_id){
        return res.status(200).json({'data':'device id is mandatory'});
    }
    let bCon = fetchTripGeofences(req.body.device_id);
    return res.status(200).json({alertFetched:bCon});
});

function fetchTripGeofences(device_id){
    for (const key in serverConfig.servers) {
        if (!serverConfig.servers.hasOwnProperty(key)) continue;
        if(servers[key] && servers[key].getActiveConnections){
            let device = servers[key].getActiveConnections(device_id);
            if(device && device.connection){
                console.log(device_id + " fetchTripGeofences  from ");
                if(device.getTripAlarms){
                    device.getTripAlarms();
                    telegramBotService.sendMessage('fetchTripGeofences for ',  device_id);
                }
                return true;
            }
        }
    }
    return false;
}

module.exports = router;
