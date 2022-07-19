/**
 * Created by Kamal on 09-08-2018.
 */

const net = require('net');
const split = require('split');
const winston = require('../utils/logger');
const telegramBotService = require('../services/telegramBotService');
const serverConfig = require('../config');
const sockets = {};
const port = 5007;
const servers = require('./servers');

const feedtype = {
    live_feed: 'lf',
    stop_feed: 'sf',
    alerts: 'a',
    stop_all: 'sa',
    heartbeat: 'h',
    update_alarm: 'ua',
    remove_alarm: 'ra',
    trip_geofence:'tg'
};

let deviceOfflineResponseForCommands = {
    status: 'ERROR',
    message: 'device offline',
    request: 'commands',
};

const server = net.createServer(function(socket){
    if(!socket.remoteAddress) {
        telegramBotService.sendAlert('no remoteAddress');
        return;
    }
    let ip = socket.remoteAddress.split(':');
    ip = ip[ip.length-1];
    sockets[ip] = socket;
    socket.id = Math.floor(Math.random() * 1000);
    telegramBotService.sendMessage(serverConfig.externalip + ' socket client connected: ' + socket.id,ip);

    socket.setKeepAlive(true, 1000);

    socket.feedRequestsForDevice = {};
    socket.alertRequestsForDevice = {};

    const stream = socket.pipe(split());
    stream.on('data', function(data) {
        // winston.info(data);
        try{
            data = JSON.parse(data);
            handleData(data, socket);
        } catch(err) {}
    });

    socket.on('end', function() {
        // This will emit events error and close, so no need to handle close separately
        socket.destroy('device side end');
    });

    socket.on('error', function(err) {
        winston.error('lmssocket err', err);
        // do nothing
    });

    socket.setTimeout(6 * 60 * 1000, function() {
        // This will emit events error and close, so no need to handle close separately
        socket.destroy('timeout');
    });

}).listen(port);

// close will be immediately followed
server.on('error', function(err){
    // winston.error('socket server error', err);
    telegramBotService.sendMessage('socket server error');
});

server.on('close', function(err){
    // winston.error('socket server close/', err);
    telegramBotService.sendMessage('socket server close');
});

function handleData(data, socket){
    switch(data.ft){
        case feedtype.heartbeat:
            sendMessage(socket, 'heartbeat', data.id);
            break;
        case feedtype.trip_geofence:
            let isDeviceConn = fetchTripGeofences(data.d);
            console.log(isDeviceConn);
            break;
      }
}

function sendMessage(socket, type, message){
    if (socket.destroyed) {
        return;
    }
    message = {type: type, msg: message};
    socket.write(Buffer.from(JSON.stringify(message)+'\n'));
}

exports.deviceConnected = function(device_id) {
    for (let key in sockets) {
        sendMessage(sockets[key], 'device_connected', device_id);
    }
};

exports.deviceDisconnected = function(device_id) {
    for (let key in sockets) {
        sendMessage(sockets[key], 'device_disconnected', device_id);
        sockets[key].feedRequestsForDevice[device_id] = null;
        delete sockets[key].feedRequestsForDevice[device_id];
    }
};

exports.sendPingToAllLmsSockets = function(data, acc_high, callback) {
    let syncDataLMS = false;
    if(data.aGpsgaadi){
        for(let g=0;g<data.aGpsgaadi.length;g++){
            let uid = data.aGpsgaadi[g].user_id;
           //if(uid == 'NAVKAR' || uid == 'SONU' || uid == 'MIDDLEMILE' || uid == 'SUMITROADLINE' || uid == 'STC' || uid == 'VL'){
           if(uid == 'NAVKAR' || uid == 'DGFC2' || uid == 'DGFC' || uid == 'DGRC' || uid == 'castrol_dgfc' || uid == 'SHELL'
               || uid == 'KISSAN' || uid == 'kamal' || uid == 'SONU' || uid == 'MIDDLEMILE' || uid == 'SUMITROADLINE'
               || uid == 'STC' || uid == 'VL'||  uid == 'annu@ispat' ||  uid == 'WCPL' ||  uid == 'churi' || uid == 'annunict' || uid == 'SIPL'){
                syncDataLMS = true;
            }
        }
    }
    //if(data.model_name == 'tk103' || data.model_name == 'ks199' || data.model_name == 'fmb190' || data.model_name == 'ais140' || data.user_id == 'DGFC'|| data.user_id == 'KISSAN' || data.user_id == 'kamal' || data.user_id == 'mayank' || data.user_id == 'praveen' || data.user_id == 'kd' || data.model_name == 'crx' || data.user_id == 'SHELL' || data.user_id == 'castrol_dgfc' ){
    //if(data.model_name == 'tk103' || data.model_name == 'ks199'){
    if(syncDataLMS){  
        let response = {};
        response.status = 'OK';
        response.request = 'live_feed';
        response.message = 'live feed';
        setStatus(data);
        response.data = prepareFeed(data);
        for (let key in sockets) {
            sendMessage(sockets[key], 'message', response);
        }
    }
    if(callback) callback();
};

exports.disconnect = function() {
    for (let key in sockets) {
        sockets[key].end();
    }
};

exports.close = function(){

};

function prepareFeed(data) {
    return {
        acc_high : data.acc_high,
        acc_high_time : data.acc_high_time,
        device_id : data.device_id,
        model_name:data.model_name,
        address : data.address,
        course : data.course,
        datetime : data.datetime,
        io_state: data.io_state,
        lat :data.lat || data.latitude,
        lng: data.lng || data.longitude,
        speed : data.speed,
        status:data.status,
        voltage : data.voltage,
        odo : data.odo || 0,
        location_time : data.location_time,
        positioning_time : data.positioning_time,
        aGpsgaadi : data.aGpsgaadi,
        user_id: data.user_id
    }
};

function fetchTripGeofences(device_id){
    for (const key in serverConfig.servers) {
        if (!serverConfig.servers.hasOwnProperty(key)) continue;
        if(servers[key] && servers[key].getActiveConnections){
            let device = servers[key].getActiveConnections(device_id);
            if(device && device.connection){
                console.log(device_id + " fetchTripGeofences  from ");
                if(device.getTripAlarms){
                    device.getTripAlarms();
                }
                return true;
            }
        }
    }
    return false;
}
function setStatus(obj,stoppageTime) {
    stoppageTime = stoppageTime?stoppageTime:3;
    let positionTime = new Date(obj.positioning_time);
    let locationTime = new Date(obj.location_time);
    let speed = obj.speed;
    let ptDiffMin=Math.ceil((new Date()-positionTime)/60000);
    let ltDiffMin=Math.ceil((new Date()-locationTime)/60000);
    if(!obj.status || obj.status === null){
        obj.s_status=4;
        return;
    }
    if (ptDiffMin < 300) {
        if (ltDiffMin <= stoppageTime && speed > 0) {
            obj.status = "running";
            obj.s_status = 1;
        }else {
            obj.status = "stopped";
            obj.s_status = 2;
            obj.speed = 0;
        }
    }else {
        obj.status="offline";
        obj.s_status=3;
    }
 };
winston.info('===========================================================\nListening for LMS Socket Server on 5007\n=================================================================');
