const serverConfig = require('../config');
serverConfig.shouldConnectToDb = true;
const dbUtils = require('../utils/dbUtils');
const db = serverConfig.database;
const async = require('async');
const tbs = require('../services/telegramBotService');
const servers = require('../servers/servers');
const cassandra = require('../utils/cassandra');
const dataProcessing = require('../utils/dataProcessing');
const dateUtils = require('../utils/dateutils');
const deviceService = require('../services/deviceService');

exports.run = function(dist){
    console.info('starting setAllDistTodayCurrent :', new Date().toString());
    tbs.sendAlert('starting setAllDistTodayCurrent :' + new Date().toString());
    let server_ip = serverConfig.externalip || '52.77.145.71';
    dbUtils.getAsync(db.table_device_inventory, 'imei', {ip:server_ip}).then(devices => {
           //devices = [{imei:18527937973}];
            async.eachSeries(devices, (imei, done) => {
                updateDistanceToday(imei.imei,dist, done);
            }, function (err) {
                if (err) {
                    console.error('imei ' + imei + " error");
                } else {
                    console.info('finished setAllDistTodayCurrent :', new Date().toString());
                    tbs.sendAlert('finished setAllDistTodayCurrent :' + new Date().toString());
                }
            });
    });
};

function setCurrentDistOnDevice(device_id,dist){
    for (const key in serverConfig.servers) {
        if (!serverConfig.servers.hasOwnProperty(key)) continue;
        if(servers[key] && servers[key].getActiveConnections){
            let conn = servers[key].getActiveConnections(device_id);
            if(conn && conn.connection){
                console.log(device_id + " dist set from "+ conn.dist_today + " to "+dist);
                conn.dist_today = dist;
                if(conn.latestLocation){
                    conn.latestLocation.dist_today = dist;
                }
                return true;
            }
        }
    }
    return false;
}
function setCurrentDistAndOdoOnDevice(device_id,Obj){
    for (const key in serverConfig.servers) {
        if (!serverConfig.servers.hasOwnProperty(key)) continue;
        if(servers[key] && servers[key].getActiveConnections){
            let conn = servers[key].getActiveConnections(device_id);
            if(conn && conn.connection){
                console.log(device_id + " dist set from "+ conn.dist_today + " to "+Obj.dist_today);
                conn.dist_today = Obj.dist_today;
                conn.odo = Obj.odo;
                if(conn.latestLocation){
                    conn.latestLocation.dist_today = Obj.dist_today;
                }
                return true;
            }
        }
    }
    return false;
}
function  updateDistanceToday(device_id,distance,done) {
    getDistanceToday(device_id,distance, (err, dist_today) => {
        if (err) {
            console.log('err ',err.toString());
            done();
            return;
        }
        let cacheUpdated = setCurrentDistOnDevice(device_id,dist_today);
        dbUtils.updateAsync(db.table_device_inventory, {imei: device_id, dist_today: dist_today || 0}).then(() => {
            cacheUpdated = setCurrentDistOnDevice(device_id,dist_today);
            done();
        }).catch(err => {
            done();
        });
    });
}
function  updateDistanceAndOdoToday(device_id,odo,done) {
    let distance;
    getDistanceToday(device_id,distance, (err, dist_today) => {
        if (err) {
            console.log('err ',err.toString());
            done();
            return;
        }
        let obj = {odo : odo,dist_today:dist_today};
        let cacheUpdated = setCurrentDistAndOdoOnDevice(device_id,obj);
        dbUtils.updateAsync(db.table_device_inventory, {imei: device_id, dist_today: dist_today || 0}).then(() => {
            cacheUpdated = setCurrentDistAndOdoOnDevice(device_id,obj);
            done();
        }).catch(err => {
            done();
        });
    });
}
function getDistanceToday(imei,distance, done) {
    if(distance !== undefined){
        return done(null,0);
    }
    cassandra.getGpsDataBetweenTimeAsync(imei, dateUtils.getMorning(new Date()).getTime(), Date.now()).then(function (das) {
        return dataProcessing.processRawDataAsync(imei,das);
    }).then(function (das) {
        for (let i = 0; i < das.length; i++) {
            if ((das[i].distance / das[i].duration * 3.6 > 160) || (das[i].distance / das[i].duration * 3.6 < 2)) {
                das[i].distance = 0;
                das[i].drive = false;
            }else if(das[i].distance < 100 && (das[i].distance / das[i].duration * 3.6 < 3)){
                das[i].distance = 0;
                das[i].drive = false;
            }
        }
        return deviceService.processADASReportV2Async(das);
    }).then(function (res) {
        if(res && res[imei]){
            res = res[imei];
            if(isNaN(res.tot_dist)){
                console.error('NaN tot_dist',imei);
            }
            done(null, res.tot_dist);
        }else{
            done(null, 0);
        }

    }).catch(function (err) {
        console.error(imei, err);
        done(err);
    });
}
exports.updateDistanceAndOdoToday = updateDistanceAndOdoToday;
exports.updateDistanceToday = updateDistanceToday;

//exports.run();

