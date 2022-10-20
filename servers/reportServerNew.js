const CronJob = require('cron').CronJob;
const deviceService = require('../services/deviceService');
const async = require('async');
const winston = require('../utils/logger');
const telegramBotService = require('../services/telegramBotService');
const cassandra = require('../utils/cassandra');
const dateutils = require('../utils/dateutils');
const dbUtils = require('../utils/dbUtils');
const database = require('../config').database;
const geozoneCalculator = require('../services/geozoneCalculator');
const allDevices = {};

module.exports.aggregateReportFromRaw = function (callback) {
    aggregateReportInternalFromRawData(callback);
};

function aggregateReportInternalFromRawData(callback) {
    winston.info('starting aggregation for ' + dateutils.getYesterdayMorning().toString());
    telegramBotService.sendAlert('starting aggregation for ' + dateutils.getYesterdayMorning().toString());
    cassandra.getAllDevicesAsync()
        .then(function (devices) {
            const deviceIds = [];
            for (let i = 0; i < devices.length; i++) {
                deviceIds.push(devices[i].imei);
                allDevices[devices[i].imei] = devices[i];
            }
            return Promise.resolve(deviceIds);
        })
        .then(aggregateYesterdaysReport)
        .then(aggregateYesterweeksReport)
        .then(aggregateYestermonthsReport)
        .catch(function (err) {
            winston.info('report server err', err);
            telegramBotService.sendAlert('report server err' + err);
        })
        .then(function () {
            winston.info('finished aggregation for ' + dateutils.getYesterdayMorning().toString());
            telegramBotService.sendAlert('finished aggregation for ' + dateutils.getYesterdayMorning().toString());
            if (callback === undefined) return;
            callback(null, 'finished aggregation for ' + dateutils.getYesterdayMorning().toString());
        });
}

function aggregateYesterdaysReportForDevice(imei, done) {
    aggregateReportForDevice(imei, dateutils.getYesterdayMorning(), dateutils.getMorning(), done);
}

function aggregateYesterdaysReport(devices) {
    return new Promise((resolve, reject) => {
        async.eachSeries(devices, (imei, done) => {
        if(allDevices[imei] && allDevices[imei].positioning_time && ((Date.now() - new Date(allDevices[imei].positioning_time).getTime()) < 25 * 60 * 60 * 1000)){
            aggregateYesterdaysReportForDevice(imei, (err, data) => {
               if(data && data.imei && allDevices[data.imei] && data.dist != undefined){
                 updateInventoryWithDist(allDevices[data.imei], data.dist);
               }
              done();
             });
        }else{
           done();
        }
}, function (err) {
        if (err) return reject(err);
        resolve(devices);
    });
});

}

function aggregateReportForDevice(imei, start, end, done) {
    // winston.info("starting aggregation for ", imei.toString(), ' for ', dateutils.getMorning(new Date(start)));
    let dist;
    cassandra.getGpsDataBetweenTimeAsync(imei, dateutils.getMorning(new Date(start)).getTime(), dateutils.getMorning(new Date(end)).getTime()).then(function (das) {
       return processRawDataAsync(imei,das);
    }).then(function (das) {
        for (let i = 0; i < das.length; i++) {
            if ((das[i].distance / das[i].duration * 3.6 > 160) || (das[i].distance / das[i].duration * 3.6 < 2)) {
                //das[i].distance = 0;
                das[i].drive = false;
            }
        }
        return deviceService.processADASReportV2Async(das);
    }).then(function (res) {
        if(res){
           res = res[imei];
           dist = res.tot_dist;
           return cassandra.batchInsertAdasRefinedNewAsync(imei, res);
        }else{
            return;
        }

    }).catch(function (err) {
        winston.info(imei, err);
    }).then(function () {
        done(null, {
            imei: imei,
            dist: dist
        });
    });
}
function processRawDataAsync(imei,data){
    return new Promise((resolve, reject) => {
        processRawData(imei,data, (err, res) => {
         if(err) return reject(err);
         resolve(res);
        });
    });
};
function processRawData(imei,data,callback) {
    let driv,nSkip=0,duration=0,distance=0,oAdas = {imei:imei,distance : 0,duration:0,nSkip:0,top_speed:0},aAdas = [];
    for (let i = 1; i < data.length; i++) {
        oAdas.imei = imei;
        duration = data[i].datetime - data[i-1].datetime;//msec
        duration = duration/1000; //sec
        if(duration>500){
            aAdas.push(oAdas);
            drive = false;
            oAdas = {distance:0,duration:10,drive:false,nSkip:0,top_speed:0};
            oAdas.start = {
                latitude: data[i].latitude,
                longitude: data[i].longitude
            };
            oAdas.start_time = data[i].datetime;
         continue;
        }
        oAdas.stop = {
            latitude: data[i].latitude,
            longitude: data[i].longitude
        };
        oAdas.end_time = data[i].datetime;
        if (oAdas.top_speed < data[i].speed) {
            oAdas.top_speed  = data[i].speed;
        }
        if(duration==0){
            continue;
        }else if(duration>300 && drive == true){//5min ping on running
            console.log('skipped running',duration);
            //console.log('****',oAdas.distance,oAdas.duration/60,oAdas.drive);
            aAdas.push(oAdas);
            drive = false;
            oAdas = {distance:distance,duration:duration,drive:false,nSkip:0,top_speed:0};
            oAdas.start = {
                latitude: data[i].latitude,
                longitude: data[i].longitude
            };
            oAdas.start_time = data[i].datetime;
        }
        distance = geozoneCalculator.getDistance({latitude : data[i-1].latitude,longitude: data[i-1].longitude}, {
            latitude: data[i].latitude,
            longitude: data[i].longitude
        });
        if(i==1){
            oAdas.start = {
                latitude: data[i-1].latitude,
                longitude: data[i-1].longitude
            };
            oAdas.start_time = data[i-1].datetime;
            if(data[0].speed == 0){
                oAdas.drive = false;
                drive=false;
            }else{
                drive = true;
                oAdas.drive = true;
            }
        }
      if((data[i].speed > 0 && data[i-1].speed > 0)){
            if(oAdas.drive == false && oAdas.nSkip > 0){
                drive = true;
                //console.log('****',oAdas.distance,oAdas.duration/60,oAdas.drive);
                aAdas.push(oAdas);
                oAdas = {imei:imei,distance:distance,duration:duration,drive:true,nSkip:0,top_speed:0};
                oAdas.start = {
                    latitude: data[i].latitude,
                    longitude: data[i].longitude
                };
                oAdas.start_time = data[i].datetime;
            }else{
                drive = true;
                oAdas.drive = true;
                oAdas.stop = {
                    latitude: data[i].latitude,
                    longitude: data[i].longitude
                };
                oAdas.distance = oAdas.distance + distance;
                oAdas.duration = oAdas.duration + duration;
                oAdas.end_time = data[i].datetime;
            }
      }else if((data[i].speed ==  0 && data[i-1].speed == 0)){
          if(oAdas.drive == false && oAdas.nSkip > 0){
              drive = true;
              //console.log('****',oAdas.distance,oAdas.duration/60,oAdas.drive);
              aAdas.push(oAdas);
              oAdas = {imei:imei,distance:distance,duration:duration,drive:true,nSkip:0,top_speed:0};
              oAdas.start = {
                  latitude: data[i].latitude,
                  longitude: data[i].longitude
              };
              oAdas.start_time = data[i].datetime;
          }else{
              drive = false;
              oAdas.drive = false;
              oAdas.stop = {
                  latitude: data[i].latitude,
                  longitude: data[i].longitude
              };
              oAdas.distance = oAdas.distance + distance;
              oAdas.duration = oAdas.duration + duration;
              oAdas.end_time = data[i].datetime;
          }
      }else if((data[i-1].speed == 0 && data[i].speed > 0)){
          if(oAdas.nSkip == 0){
              oAdas.nSkip++;
              oAdas.stop = {
                  latitude: data[i].latitude,
                  longitude: data[i].longitude
              };
              oAdas.distance = oAdas.distance + distance;
              oAdas.dur = oAdas.duration + duration;
              oAdas.end_time = data[i].datetime;
          }else if(oAdas.nSkip > 0 && oAdas.drive == true){
              //already running
              oAdas.stop = {
                  latitude: data[i].latitude,
                  longitude: data[i].longitude
              };
              oAdas.distance = oAdas.distance + distance;
              oAdas.duration = oAdas.duration + duration;
              oAdas.end_time = data[i].datetime;
          }else{
                drive = true;
                //console.log('****',oAdas.distance,oAdas.duration/60,oAdas.drive);
                aAdas.push(oAdas);
                oAdas = {imei:imei,distance:distance,duration:duration,drive:true,nSkip:0,top_speed:0};
                oAdas.start = {
                    latitude: data[i].latitude,
                    longitude: data[i].longitude
                };
                oAdas.start_time = data[i].datetime;
            }
      }else if((data[i-1].speed > 0 && data[i].speed == 0)){
            if(oAdas.nSkip == 0){
                oAdas.nSkip++;
                oAdas.stop = {
                    latitude: data[i].latitude,
                    longitude: data[i].longitude
                };
                oAdas.distance = oAdas.distance + distance;
                oAdas.duration = oAdas.duration + duration;
                oAdas.end_time = data[i].datetime;
            }else if(oAdas.nSkip > 0 && oAdas.drive == false){
                //already running
                oAdas.stop = {
                    latitude: data[i].latitude,
                    longitude: data[i].longitude
                };
                oAdas.distance = oAdas.distance + distance;
                oAdas.duration = oAdas.duration + duration;
                oAdas.end_time = data[i].datetime;
            }else{
              drive = false;
              //console.log('****',oAdas.distance,oAdas.duration/60,oAdas.drive);
              aAdas.push(oAdas);
              oAdas = {imei:imei,distance:distance,duration:duration,drive:false,nSkip:0,top_speed:0};
              oAdas.start = {
                  latitude: data[i].latitude,
                  longitude: data[i].longitude
              };
              oAdas.start_time = data[i].datetime;
          }
      }
      //console.log(drive,duration,distance,distance*3.6/duration,data[i].speed);
        if(i == data.length-1){
            //console.log('****',oAdas.distance,oAdas.duration/60,oAdas.drive);
            oAdas.stop = {
                latitude: data[i].latitude,
                longitude: data[i].longitude
            };
            oAdas.end_time = data[i].datetime;
            aAdas.push(oAdas);
        }
    }
    console.log(oAdas.imei,aAdas.length,data.length);
    callback(null,aAdas);
};
