/**
 * @Author: kamal
 * @Date:   2018-08-29
 */

const BPromise = require('bluebird');
const router = require('express').Router();
const async = BPromise.promisifyAll(require('async'));
const servers = require('../servers/servers');
const serverConfig = require('../config');
const cassandra = require('../utils/cassandra');
const setDistToCurrent = require('../scripts/setDistToCurrent');


router.post("/getDistForDevice", function (req, res, next) {
    let device_id = req.body.device_id;
    setDistToCurrent.updateDistanceToday(device_id,undefined,function(err,resp){
        return res.status(200).json({device_id:device_id});

    });
});

router.post("/getDistForUser", function (req, res, next) {
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

        async.eachSeries(device_ids, (imei, done) => {
            let dist;
            setDistToCurrent.updateDistanceToday(imei.imei,dist, done);
        }, function (err) {
            if (err) {
                console.error('imei ' + imei + " error");
            } else {
                console.info('finished setAllDistTodayCurrent :', new Date().toString());
                //tbs.sendAlert('finished setAllDistTodayCurrent :' + new Date().toString());
            }
        });
       });
});
module.exports = router;
