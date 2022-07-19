/**
* Created by Kamal on 04-06-2016.
*/
const cassandraDbInstance = require('../utils/cassandraDBInstance');
const database = require('../config').database;
const winston = require('../utils/logger');

const allowedFieldsForUpdate = ['status', 'enabled', 'end_time', 'gps_status', 'journey', 'last_tracking', 'loading', 'start_time',
	'trip_date', 'unloading','geofence_events'];
const prepareUpdateQuery = function (oAlarm) {
	let sQuery = "";
	const aParam = [], oRet = {};
	for (const key in oAlarm) {
		if (allowedFieldsForUpdate.indexOf(key) > -1) {
			aParam.push(oAlarm[key]);
			if (sQuery) { // prevent ',' to append initially
				sQuery = sQuery + "," + key + "=?";
			} else {
				sQuery = key + "=?";
			}
		}
	}
	oRet.sQuery = sQuery;
	oRet.aParam = aParam;
	return oRet;
};
function getTrip(request, callback) {

	const query = 'SELECT * FROM ' + database.table_Trip + ' WHERE trip_id = ? ';
	const aParams = [request.trip_id];
		cassandraDbInstance.execute(query,aParams,{prepare:true}, function(err, result){
		if(err){
			winston.error(err);
			callback(err);
			return;
		}
		if(result && result.rows){
	    	callback(err, result.rows);
		}

	});
}
function updateTripHeper(oAlarm,oPing,callback){
	const oUpdate = {};
	if(oAlarm.milestone === 'loading' && oAlarm.entry === 1){
		if(oAlarm.trip_loading){
			oUpdate.loading = oAlarm.trip_loading;
		}else{
			oUpdate.loading = {};
		}
		oUpdate.loading.start_time = oPing.datetime;
		oUpdate.loading.lat = oPing.lat;
		oUpdate.loading.lng = oPing.lng;
		oUpdate.loading.speed = oPing.speed;
		oUpdate.loading.course = oPing.course;
    	oUpdate.status = 'loading';
		oUpdate.start_time = oPing.datetime;
	}else if(oAlarm.milestone === 'loading' && oAlarm.exit === 1){
		if(oAlarm.trip_loading){
			oUpdate.loading = oAlarm.trip_loading;
		}else{
			oUpdate.loading = {};
		}
		oUpdate.loading.end_time = oPing.datetime;
		oUpdate.loading.lat = oPing.lat;
		oUpdate.loading.lng = oPing.lng;
		oUpdate.loading.speed = oPing.speed;
		oUpdate.loading.course = oPing.course;
		if(oAlarm.trip_jouney){
			oUpdate.journey = oAlarm.trip_jouney;
		}else{
			oUpdate.journey = {};
		}
		oUpdate.journey.start_time = oPing.datetime;
		oUpdate.journey.lat = oPing.lat;
		oUpdate.journey.lng = oPing.lng;
		oUpdate.journey.speed = oPing.speed;
		oUpdate.journey.course = oPing.course;
		oUpdate.status = 'journey';
	}else if(oAlarm.milestone === 'unloading' && oAlarm.entry === 1){
		if(oAlarm.trip_unloading){
			oUpdate.unloading = oAlarm.trip_unloading;
		}else{
			oUpdate.unloading = {};
		}
		oUpdate.unloading.start_time = oPing.datetime;
		oUpdate.unloading.lat = oPing.lat;
		oUpdate.unloading.lng = oPing.lng;
		oUpdate.unloading.speed = oPing.speed;
		oUpdate.unloading.course = oPing.course;
		if(oAlarm.trip_jouney){
			oUpdate.journey = oAlarm.trip_jouney;
		}else{
			oUpdate.journey = {};
		}
		oUpdate.journey.end_time = oPing.datetime;
		oUpdate.journey.lat = oPing.lat;
		oUpdate.journey.lng = oPing.lng;
		oUpdate.journey.speed = oPing.speed;
		oUpdate.journey.course = oPing.course;
		oUpdate.status = 'unloading';
	}else if(oAlarm.milestone === 'unloading' && oAlarm.exit === 1){
		if(oAlarm.trip_unloading){
			oUpdate.unloading = oAlarm.trip_unloading;
		}else{
			oUpdate.unloading = {};
		}
		oUpdate.unloading.end_time = oPing.datetime;
		oUpdate.unloading.lat = oPing.lat;
		oUpdate.unloading.lng = oPing.lng;
		oUpdate.unloading.speed = oPing.speed;
		oUpdate.unloading.course = oPing.course;
		oUpdate.end_time = oPing.datetime;
		oUpdate.status = 'complete';
	}

	//prepare geofence event
	var oGeofenceEvent = {
		name : oAlarm.name,
        type:oAlarm.type,
        entry:oAlarm.entry,
        exit:oAlarm.exit,
        enabled:oAlarm.enabled,
		lat : oPing.lat,
		lng:oPing.lng,
		sms:oAlarm.sms,
		email:oAlarm.email,
		datetime:oPing.datetime,
		created_at:oAlarm.created_at,
		loc:oAlarm.loc,
		addr:oPing.address
	};
	console.log('trip geofence_events for '+  oAlarm.vehicle_no +' user id : '+ oAlarm.user_id+' trip no: '+oAlarm.trip_no);
	if(oAlarm.geofence_events){
        oUpdate.geofence_events = oAlarm.geofence_events;
	}else{
        oUpdate.geofence_events = [];
	}
    oUpdate.geofence_events.push(oGeofenceEvent);

	oUpdate.last_tracking = {};
	oUpdate.last_tracking.start_time = oPing.datetime;
	oUpdate.last_tracking.lat = oPing.lat;
	oUpdate.last_tracking.lng = oPing.lng;
	oUpdate.last_tracking.speed = oPing.speed;
	oUpdate.last_tracking.course = oPing.course;

	const oQueryParam = prepareUpdateQuery(oUpdate);
	let sQuery = oQueryParam.sQuery;
	const aParam = oQueryParam.aParam;
	sQuery = 'UPDATE '+database.table_Trip+ ' SET '+ sQuery +' WHERE trip_id = ?';
	aParam.push(oAlarm.trip_id);
	cassandraDbInstance.execute(sQuery,aParam,
	{ prepare : true },	function(err, result){
		if(err){
			callback(err, null);
			winston.error(err);
			return;
		}
		if(!result){
			return callback(err, null);
		}
		return callback(err, oUpdate);
	});
}

function updateTrip(oAlarm,oPing,callback) {
	function getTripCB(err,res){
		if(err){
			winston.error(err);
		}else if(res && res.length>0){
			oAlarm.trip_created = res[0].created_at;
			oAlarm.trip_user = res[0].user_id;
			oAlarm.trip_loading = res[0].loading;
			oAlarm.trip_unloading = res[0].unloading;
			oAlarm.trip_journey = res[0].journey;
			oAlarm.geofence_events = res[0].geofence_events;
			oAlarm.trip_no = res[0].trip_no;
			updateTripHeper(oAlarm,oPing,callback);
		}
	}
	const oReq = {'trip_id': oAlarm.trip_id};
	getTrip(oReq,getTripCB);
}

module.exports.updateTrip=updateTrip;

exports.updateTripGeofenceEvent = function(trip_id, geofence_event, callback) {
	const query = 'update trips set geofence_events = ? + geofence_events,last_modified_at = ? where trip_id = ?';
	const params = [geofence_event,Date.now(),trip_id];
	cassandraDbInstance.execute(query, params, {prepare: true}, callback);
};
