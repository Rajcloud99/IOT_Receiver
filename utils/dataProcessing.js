const geozoneCalculator = require('../services/geozoneCalculator');
const async = require('async');

module.exports.processRawDataAsync =  function(imei,data){
    return new Promise((resolve, reject) => {
        processRawData(imei,data, (err, res) => {
        if(err) return reject(err);
        resolve(res);
    });
});
};

function processRawData(imei,data,callback){
	let drive, nSkip = 0, duration = 0, distance = 0, oAdas = { imei: imei, distance: 0, duration: 0, nSkip: 0, top_speed: 0 }, aAdas = [];
	for (let i = 1; i < data.length; i++) {
		if (!oAdas.points) {
			oAdas.points = [];
		}
		oAdas.imei = imei;
		duration = data[i].datetime - data[i - 1].datetime;//msec
		duration = duration / 1000; //sec
		distance = geozoneCalculator.getDistance({ latitude: data[i - 1].latitude, longitude: data[i - 1].longitude }, {
			latitude: data[i].latitude,
			longitude: data[i].longitude
		});
		let eSpeed = distance/duration * 3.6;
		if(false && duration < 300 && eSpeed > 80){
			//case 1 if i=1 check if first point is wrong
			if(i==1){
				if(data[i+1] && data[i+2]){
					distanceNext = geozoneCalculator.getDistance({ latitude: data[i-1].latitude, longitude: data[i-1].longitude }, {
						latitude: data[i+1].latitude,
						longitude: data[i+1].longitude
					});
					durationNext = data[i+1].datetime - data[i - 1].datetime;//msec
					durationNext = durationNext / 1000; //sec
					let eSpeedNext = distanceNext/durationNext * 3.6;
					distanceNextNext = geozoneCalculator.getDistance({ latitude: data[i-1].latitude, longitude: data[i-1].longitude }, {
						latitude: data[i+2].latitude,
						longitude: data[i+2].longitude
					});
					durationNextNext = data[i+2].datetime - data[i - 1].datetime;//msec
					durationNextNext = durationNextNext / 1000; //sec
					let eSpeedNextNext = distanceNextNext/durationNextNext * 3.6;
					if(durationNext < 400  && durationNextNext < 500 && distanceNext>1000 && distanceNextNext>1000){
						data.splice(i-1,1);
						continue;
					}
				}
			}else{
				//assuming that start point is perfect
				//todo what if start point is wrong?
				if(data[i+1] && data[i+2]){
					//next data exists
					distanceNext = geozoneCalculator.getDistance({ latitude: data[i].latitude, longitude: data[i].longitude }, {
						latitude: data[i+1].latitude,
						longitude: data[i+1].longitude
					});
					durationNext = data[i+1].datetime - data[i].datetime;//msec
					durationNext = durationNext / 1000; //sec
					let eSpeedNext = distanceNext/durationNext * 3.6;
					distanceNextNext = geozoneCalculator.getDistance({ latitude: data[i].latitude, longitude: data[i].longitude }, {
						latitude: data[i+2].latitude,
						longitude: data[i+2].longitude
					});
					durationNextNext = data[i+2].datetime - data[i].datetime;//msec
					durationNextNext = durationNextNext / 1000; //sec
					let eSpeedNextNext = distanceNextNext/durationNextNext * 3.6;
					if(eSpeedNext>70 && eSpeedNextNext>70){
						//2nd point distance is less than first point distance then remove 1st point
						data.splice(i,1);
						continue;
					}
				}
			}

			//TODO check prev points
			//TODO check next points
		}
		if (!oAdas.stop && distance < 300) {
			oAdas.stop = {
				latitude: data[i].latitude,
				longitude: data[i].longitude
			};
			oAdas.distance = oAdas.distance + distance;
			oAdas.duration = oAdas.duration + duration;
			oAdas.end_time = data[i].datetime;
			if (oAdas.top_speed < data[i].speed && data[i].speed < limit.speed) {
				oAdas.top_speed = data[i].speed;
			}
		}

		if (duration > 400 && oAdas.start) {
			if (!oAdas.stop && oAdas.duration < 200) {
				drive = false;
				oAdas = { distance: 0, duration: 10, drive: false, nSkip: 0, top_speed: 0 };
				oAdas.start = {
					latitude: data[i].latitude,
					longitude: data[i].longitude
				};
				oAdas.start_time = data[i].datetime;
				oAdas.points = [data[i]];
			} else {
				if (!oAdas.stop) {
					oAdas.stop = {
						latitude: data[i].latitude,
						longitude: data[i].longitude
					};
					oAdas.distance = oAdas.distance + distance;
					oAdas.duration = oAdas.duration + duration;
					oAdas.end_time = data[i].datetime;
					if (oAdas.top_speed < data[i].speed) {
						oAdas.top_speed = data[i].speed;
					}
				}
				oAdas.duration = (oAdas.end_time - oAdas.start_time) / 1000;
				//start check drive and false
				let spd = oAdas.distance / oAdas.duration * 3.6;
				if (!oAdas.drive && oAdas.distance > 200 && spd > 10) {
					oAdas.drive = true;
				}else if(oAdas.drive && (oAdas.distance < 200 || spd < 3)){
					oAdas.drive = false;
					//data[i].distance = 0;
				}
				//stop check drive and false
				aAdas.push(oAdas);
				drive = false;
				oAdas = { distance: 0, duration: 10, drive: false, nSkip: 0, top_speed: 0 };
				oAdas.start = {
					latitude: data[i].latitude,
					longitude: data[i].longitude
				};
				oAdas.start_time = data[i].datetime;
				oAdas.points = [data[i]];
			}
			continue;
		}
		oAdas.stop = {
			latitude: data[i].latitude,
			longitude: data[i].longitude
		};
		oAdas.end_time = data[i].datetime;
		oAdas.points.push(data[i]);
		if (oAdas.top_speed < data[i].speed && data[i].speed < limit.speed) {
			oAdas.top_speed = data[i].speed;
		}
		if (duration == 0) {
			continue;
		} else if (duration > 300 && drive == true) {//5min ping on running
			oAdas.duration = (oAdas.end_time - oAdas.start_time) / 1000;
			//start check drive and false
			let spd = oAdas.distance / oAdas.duration * 3.6;
			if (!oAdas.drive && oAdas.distance > 200 && spd > 10) {
				oAdas.drive = true;
			}else if(oAdas.drive && (oAdas.distance < 200 || spd < 3)){
				oAdas.drive = false;
				//data[i].distance = 0;
			}
			//stop check drive and false
			aAdas.push(oAdas);
			drive = false;
			oAdas = { distance: distance, duration: duration, drive: false, nSkip: 0, top_speed: 0 };
			oAdas.start = {
				latitude: data[i].latitude,
				longitude: data[i].longitude
			};
			oAdas.start_time = data[i].datetime;
		}
		distance = geozoneCalculator.getDistance({ latitude: data[i - 1].latitude, longitude: data[i - 1].longitude }, {
			latitude: data[i].latitude,
			longitude: data[i].longitude
		});
		//console.log(distance);
		if (i == 1) {
			oAdas.start = {
				latitude: data[i - 1].latitude,
				longitude: data[i - 1].longitude
			};
			oAdas.start_time = data[i - 1].datetime;
			if (data[0].speed == 0) {
				oAdas.drive = false;
				drive = false;
			} else {
				drive = true;
				oAdas.drive = true;
			}
		}
		if ((data[i].speed > 0 && data[i - 1].speed > 0)) {
			if (oAdas.drive == false && oAdas.nSkip > 0) {
				drive = true;
				oAdas.duration = (oAdas.end_time - oAdas.start_time) / 1000;
				//start check drive and false
				let spd = oAdas.distance / oAdas.duration * 3.6;
				if (!oAdas.drive && oAdas.distance > 200 && spd > 10) {
					oAdas.drive = true;
				}else if(oAdas.drive && (oAdas.distance < 200 || spd < 3)){
					oAdas.drive = false;
					//data[i].distance = 0;
				}
				//stop check drive and false
				aAdas.push(oAdas);
				oAdas = { imei: imei, distance: distance, duration: duration, drive: true, nSkip: 0, top_speed: 0 };
				oAdas.start = {
					latitude: data[i].latitude,
					longitude: data[i].longitude
				};
				oAdas.start_time = data[i].datetime;
			} else {
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
		} else if ((data[i].speed == 0 && data[i - 1].speed == 0)) {
			if (oAdas.drive == false && oAdas.nSkip > 0) {
				drive = true;
				oAdas.duration = (oAdas.end_time - oAdas.start_time) / 1000;
				//start check drive and false
				let spd = oAdas.distance / oAdas.duration * 3.6;
				if (!oAdas.drive && oAdas.distance > 200 && spd > 10) {
					oAdas.drive = true;
				}else if(oAdas.drive && (oAdas.distance < 200 || spd < 3)){
					oAdas.drive = false;
					//data[i].distance = 0;
				}
				//stop check drive and false
				aAdas.push(oAdas);
				oAdas = { imei: imei, distance: distance, duration: duration, drive: true, nSkip: 0, top_speed: 0 };
				oAdas.start = {
					latitude: data[i].latitude,
					longitude: data[i].longitude
				};
				oAdas.start_time = data[i].datetime;
				oAdas.points = [data[i]];
			} else {
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
		} else if ((data[i - 1].speed == 0 && data[i].speed > 0)) {
			if (oAdas.nSkip == 0) {
				oAdas.nSkip++;
				oAdas.stop = {
					latitude: data[i].latitude,
					longitude: data[i].longitude
				};
				oAdas.distance = oAdas.distance + distance;
				oAdas.duration = oAdas.duration + duration;
				oAdas.end_time = data[i].datetime;
			} else if (oAdas.nSkip > 0 && oAdas.drive == true) {
				//already running
				oAdas.stop = {
					latitude: data[i].latitude,
					longitude: data[i].longitude
				};
				oAdas.distance = oAdas.distance + distance;
				oAdas.duration = oAdas.duration + duration;
				oAdas.end_time = data[i].datetime;
			} else {
				drive = true;
				oAdas.duration = (oAdas.end_time - oAdas.start_time) / 1000;
				//start check drive and false
				let spd = oAdas.distance / oAdas.duration * 3.6;
				if (!oAdas.drive && oAdas.distance > 200 && spd > 10) {
					oAdas.drive = true;
				}else if(oAdas.drive && (oAdas.distance < 200 || spd < 3)){
					oAdas.drive = false;
					//data[i].distance = 0;
				}
				//stop check drive and false
				aAdas.push(oAdas);
				oAdas = { imei: imei, distance: distance, duration: duration, drive: true, nSkip: 0, top_speed: 0 };
				oAdas.start = {
					latitude: data[i].latitude,
					longitude: data[i].longitude
				};
				oAdas.start_time = data[i].datetime;
				oAdas.points = [data[i]];
			}
		} else if ((data[i - 1].speed > 0 && data[i].speed == 0)) {
			if (oAdas.nSkip == 0) {
				oAdas.nSkip++;
				oAdas.stop = {
					latitude: data[i].latitude,
					longitude: data[i].longitude
				};
				oAdas.distance = oAdas.distance + distance;
				oAdas.duration = oAdas.duration + duration;
				oAdas.end_time = data[i].datetime;
			} else if (oAdas.nSkip > 0 && oAdas.drive == false) {
				oAdas.stop = {
					latitude: data[i].latitude,
					longitude: data[i].longitude
				};
				oAdas.distance = oAdas.distance + distance;
				oAdas.duration = oAdas.duration + duration;
				oAdas.end_time = data[i].datetime;
			} else {
				drive = false;
				oAdas.duration = (oAdas.end_time - oAdas.start_time) / 1000;
				//start check drive and false
				let spd = oAdas.distance / oAdas.duration * 3.6;
				if (!oAdas.drive && oAdas.distance > 200 && spd > 10) {
					oAdas.drive = true;
				}else if(oAdas.drive && (oAdas.distance < 200 || spd < 3)){
					oAdas.drive = false;
					//data[i].distance = 0;
				}
				//stop check drive and false
				aAdas.push(oAdas);
				oAdas = { imei: imei, distance: distance, duration: duration, drive: false, nSkip: 0, top_speed: 0 };
				oAdas.start = {
					latitude: data[i].latitude,
					longitude: data[i].longitude
				};
				oAdas.start_time = data[i].datetime;
				oAdas.points = [data[i]];
			}
		}
		if (i == data.length - 1) {
			oAdas.stop = {
				latitude: data[i].latitude,
				longitude: data[i].longitude
			};
			oAdas.end_time = data[i].datetime;
			oAdas.duration = (oAdas.end_time - oAdas.start_time) / 1000;
			//start check drive and false
			let spd = oAdas.distance / oAdas.duration * 3.6;
			if (!oAdas.drive && oAdas.distance > 200 && spd > 10) {
				oAdas.drive = true;
			}else if(oAdas.drive && (oAdas.distance < 200 || spd < 3)){
				oAdas.drive = false;
				//data[i].distance = 0;
			}
			//stop check drive and false
			aAdas.push(oAdas);
		}
	}
	callback(null, aAdas);
};

module.exports.checkAnomaly = function(das){
	for (let i = 0; i < das.length; i++) {
		let spd = das[i].distance / das[i].duration * 3.6;
		if (das[i].drive && spd > 100) {
			das[i].distance = 0;
			das[i].drive = false;
		}else if (das[i].drive && spd < 3) {
			//das[i].distance = 0;
			das[i].drive = false;
		} else if (das[i].drive && das[i].distance < 250 && spd < 10) {
			//das[i].distance = 0;
			das[i].drive = false;
		} else {
			//console.log(das[i].distance,das[i].duration,das[i].distance / das[i].duration * 3.6);
		}
	}
}

module.exports.checkIdleingFromADAS = function(das,oSettings = {}){
	for (let j = 0; j < das.length; j++) {
		if(das[j].drive){
			if(oSettings.removePoints){
				delete das[j].points;
			}
			if(oSettings.removeDrives){
				das.splice(j, 1);
			}
			continue;
		}
		if (das[j].drive == false && das[j].points && das[j].points.length) {
			let aIdling = exports.processRawDataForIdling(das[j].points);
			let cIdle = 1;
			//das[j].aIdling = aIdling;
			let oStoppage = Object.assign({},das[j]);//copy object to prevent ref updating
			delete oStoppage.points;
			for (let i = 0; i < aIdling.length; i++) {
				if (i == 0 && aIdling[i].duration > 180) {
					if(aIdling[i].idle){
						das[j].start_time = aIdling[i].start_time;
					    das[j].end_time = aIdling[i].end_time;
					    das[j].idle = aIdling[i].idle;
					    das[j].duration = aIdling[i].duration;
						das[j].idle_duration = aIdling[i].duration;
					}else{
						das[j].idle = aIdling[i].idle;
					}	
				}else if(i > 0 && aIdling[i].duration > 180){
					oStoppage.strat_time = aIdling[i].start_time;
					oStoppage.end_time = aIdling[i].end_time;
					oStoppage.idle = aIdling[i].idle;
					oStoppage.duration = aIdling[i].duration;
					oStoppage.idle_duration = oStoppage.duration;
					oStoppage.distance = 0;
					das[j].end_time = aIdling[i].start_time;
					das.splice((j + cIdle), 0, oStoppage);
					cIdle++;
				}
			}
		}
		if(oSettings.removePoints){
			delete das[j].points;
		}
	}
}

exports.processRawDataForIdling = function(data,callback) {
	let idle,nSkip=0,duration=0,oAdas = {duration:0,nSkip:0},aAdas = [];
	for (let i = 1; i < data.length; i++) {
		if(data[i].ignition == undefined || data[i].ignition == null){
			continue;
		}
		duration = data[i].datetime - data[i-1].datetime;//msec
		duration = duration/1000; //sec

		if(i==1){
			oAdas.start_time = data[i-1].datetime;
			if(data[0].ignition == 0){
				oAdas.idle = false;
				idle=false;
			}else if(data[0].ignition == 1){
				idle = true;
				oAdas.idle = true;
			}
		}
		if((data[i].ignition == 1 && data[i-1].ignition == 1)){
			if(oAdas.idle == false && oAdas.nSkip > 0){
				idle = true;
				oAdas.duration = (oAdas.end_time - oAdas.start_time)/1000;
				aAdas.push(oAdas);
				oAdas = {duration:duration,idle:true,nSkip:0};
				oAdas.start_time = data[i].datetime;
			}else{
				idle = true;
				oAdas.idle = true;
				oAdas.duration = oAdas.duration + duration;
				oAdas.end_time = data[i].datetime;
			}
		}else if((data[i].ignition ==  0 && data[i-1].ignition == 0)){
			if(oAdas.idle == false && oAdas.nSkip > 0){
				idle = true;
				oAdas.duration = (oAdas.end_time - oAdas.start_time)/1000;
				aAdas.push(oAdas);
				oAdas = {duration:duration,idle:true,nSkip:0};
				oAdas.start = {
					latitude: data[i].latitude,
					longitude: data[i].longitude
				};
				oAdas.start_time = data[i].datetime;
			}else{
				idle = false;
				oAdas.idle = false;
				oAdas.duration = oAdas.duration + duration;
				oAdas.end_time = data[i].datetime;
			}
		}else if((data[i-1].ignition == 0 && data[i].ignition > 0)){
			if(oAdas.nSkip == 0){
				oAdas.nSkip++;
				oAdas.duration = oAdas.duration + duration;
				oAdas.end_time = data[i].datetime;
			}else if(oAdas.nSkip > 0 && oAdas.idle == true){
				oAdas.duration = oAdas.duration + duration;
				oAdas.end_time = data[i].datetime;
			}else{
				idle = true;
				oAdas.duration = (oAdas.end_time - oAdas.start_time)/1000;
				aAdas.push(oAdas);
				oAdas = {duration:duration,idle:true,nSkip:0};
				oAdas.start_time = data[i].datetime;
			}
		}else if((data[i-1].ignition > 0 && data[i].ignition == 0)){
			if(oAdas.nSkip == 0){
				oAdas.nSkip++;
				oAdas.duration = oAdas.duration + duration;
				oAdas.end_time = data[i].datetime;
			}else if(oAdas.nSkip > 0 && oAdas.idle == false){
				oAdas.duration = oAdas.duration + duration;
				oAdas.end_time = data[i].datetime;
			}else{
				idle = false;
				oAdas.duration = (oAdas.end_time - oAdas.start_time)/1000;
				aAdas.push(oAdas);
				oAdas = {duration:duration,idle:false,nSkip:0};
				oAdas.start_time = data[i].datetime;
			}
		}
		if(i == data.length-1){
			oAdas.end_time = data[i].datetime;
			oAdas.duration = (oAdas.end_time - oAdas.start_time)/1000;
			aAdas.push(oAdas);
		}
	}
	return aAdas;
};

exports.processRawDataForFuelRefillDrain = function(imei,data) {
	let fuelChange = [];
	for (let i = 1; i < data.length; i++) {
       if(data[i].fl && data[i-1].fl) {
		   let diffInLtr = data[i].fl - data[i - 1].fl;
		   let dur = data[i].datetime - data[i -1].datetime;//ms
		   dur = dur/1000; //sec

		   if (diffInLtr > 10 && dur < 360) {//less than 60 min
			   //refill
			   //TODO check for next 10 min
			   fuelChange.push(data[i]);
			   console.log('refill', diffInLtr);
		   } else if (diffInLtr < -10 && dur < 360) {
			   //drain
			   //TODO check for next 10 min
			   fuelChange.push(data[i]);
			   console.log('drain', diffInLtr);
		   }
	   }
	}
	return  fuelChange;
};
