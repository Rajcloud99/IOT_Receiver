/**
 * Created by kamal on 16/09/17.
 */

const config = require('../config');
const cassandra = require('./cassandra');
const winston = require('./logger');

exports.deubgDeviceData = function (oData) {
        cassandra.getDeviceToDebug(oData.device_id,function (resp) {
            if(resp){
                debugDevice(oData);
            }
        });
};
function debugDevice(oData) {
    //winston.info(oData.packet);
    //winston.info(oData.parts);
    cassandra.insertDataPacket(oData);
}