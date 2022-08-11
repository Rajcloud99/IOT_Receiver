/**
 * This script runs the aggregation logic from reportserver.js
 * Set the required date in the start variable and script will execute aggregation from previous day till today.
 * Use cleanAdas script to clean if required.
 * Be sure to run updateInventoryDist script after running this.
 **/

require('../utils/dbConf').isDBLocal = false;
const config = require('../config');
config.shouldConnectToDb = true;
config.externalip = '65.1.183.173';

//config.externalip = '52.77.111.181';

const start = new Date('2022-07-20');

process.env.TZ = 'Asia/Calcutta';
const dateutils = require('../utils/dateutils');
const winston = require('../utils/logger');
//const reportServerNew = require('../servers/reportServerNew');
const reportServer = require('../servers/reportServer');

let systemDate = new Date();

dateutils.getMorning = function(date2) {
    const date = date2 || new Date(systemDate);
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
};

dateutils.getYesterdayMorning = function() {
    const date = new Date(systemDate);
    date.setDate(date.getDate() - 1);
    return dateutils.getMorning(date);
};

systemDate = start;
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
const cb = function (err, res) {
    systemDate.setDate(systemDate.getDate() + 1);
    if (dateutils.getMorning().getDate() === tomorrow.getDate() && dateutils.getMorning().getMonth() === tomorrow.getMonth()) {
        winston.info('done');
    } else {
        console.log('starting for',dateutils.getMorning());
        //reportServer.aggregateReport(cb);
    }
};

reportServer.aggregateReport(cb);
