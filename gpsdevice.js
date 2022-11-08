const geozoneCalculator = require('./services/geozoneCalculator');
const deviceService = require('./services/deviceService');
const alarmService = require('./services/alarmService');
const winston = require('./utils/logger');
const cassandra = require('./utils/cassandra');
const externalip = require('./config').externalip;
const socketServer = require('./servers/socketserver');
const addressService = require('./services/addressService');
const async = require('async');
const dbUtils = require('./utils/dbUtils');
const database = require('./config').database;
const alarms = require('./config').alarms;
const servers = require('./servers/servers');
const dateUtils = require('./utils/dateutils');
const config = require('./config');
const lmsSocketServer = require('./servers/lmssocket');
const dataProcessing = require('./utils/dataProcessing');
const lmsDbService = require('./services/lmsDbService');
const emailService = require('./services/emailService');
const PointInPolygon = require('./utils/pointInsidePolygoan');
const setDistToCurrent = require('./scripts/setDistToCurrent');
const oneSignalNotification = require('./utils/onseSignalNotification');
/*************************************************************

 THE DEVICE CLASS
 **************************************************************/

function getCopy(obj) {
	return JSON.parse(JSON.stringify(obj));
}

class Device {

	constructor(adapter, connection) {
		this.adapter = new adapter(this);
		this.connection = connection;
        this.connection.c_id = Math.floor(Math.random() * 1000);
		this.model_name = adapter.model_name;
		this.ip = connection.ip;
		this.port = connection.localPort;

		this.lastLocationTime = Date.now() - 10 * 60 * 1000;  //Accept first location max 10 mins ago.
		this.lastOverspeed = 0;
		this.lastAddrTime = 0;

		this.shouldRedirectToDevelop = false;//config.isTestServer;

		this.dataListener = data => {
			this.processData(data);
		};

		this.logAll = false;
        //put imei in config to log its data
		if(!config.logOne) {
			this.logOne = 357073295741991
		}else{
			this.logOne = config.logOne;
		}

		this.endListener = () => {
			if(this.getUID() == this.logOne){
				console.log('endListener',this.getUID());
			}
			if(this.connection) this.connection.end();
       	};

		this.closeListener = had_error => {
       	if(this.getUID() == this.logOne){
				console.log('closeListener',this.getUID());
			}
			if(had_error){
				console.error('this.closeListener error had_error ',had_error,this.getUID());
			}
			this.handleDisconnection();
		};

		this.timeoutListener = () => {
            if(this.getUID() == this.logOne){
				console.log('timeoutListener',this.getUID());
			}
            this.connection.end();
			this.connection.destroy(new Error('timeout'));
		};

		this.errorListener = err => {
          	if(this.getUID() == this.logOne){
				console.log('errorListener',this.getUID());
			}
            if(this.connection) this.connection.end();
		};

		this.attachConnectionListeners();

	}

	get server() {
		return servers[this.model_name];
	}

	attachConnectionListeners() {
		this.connection.on('data', this.dataListener);
		this.connection.on('end', this.endListener);
		this.connection.on('close', this.closeListener);
		this.connection.on('timeout', this.timeoutListener);
		this.connection.on('error', this.errorListener);
	}

	detachConnectionListeners() {
      	this.connection.removeListener('data', this.dataListener);
		this.connection.removeListener('end', this.endListener);
		this.connection.removeListener('close', this.closeListener);
		this.connection.removeListener('timeout', this.timeoutListener);
		this.connection.removeListener('error', this.errorListener);
	}

	/****************************************
	 RECEIVING DATA FROM THE DEVICE
	 ****************************************/
	processData(data) {
	    const msg_parts = this.adapter.parse_data(data);

		if (!msg_parts) { //protocol not decoded properly or invalid data sent from device
			return;
		}
        if (!msg_parts.device_id) {
			//console.log('packet without device id',this.model_name);
            //return;
        }

        if (!this.getUID() && !msg_parts.device_id) {
            console.error(this.model_name, 'no device id!');
            //TODO fix protocol
            console.log("no device id for "+  this.model_name + " " + JSON.stringify(msg_parts));
            return;
        }

		if (!msg_parts.cmd) {
			return;
		}

		if (!this.getUID()) {
			this.setUID(msg_parts.device_id);
			if (this.server.find_device(this.getUID())) {
            	if(this.logOne){
            		let oldDeviceConn = this.server.find_device(this.getUID());
            		if(oldDeviceConn.latestLocation && oldDeviceConn.latestLocation.datetime){
            			//console.log(this.getUID(), this.model_name, ' time difference in sec',(new Date().getTime() - new Date(oldDeviceConn.latestLocation.datetime).getTime())/1000);
					}
					if(this.getUID() == this.logOne){
						console.log('overriding connection for ',this.getUID(),this.model_name);
					}
				}

				this.detachConnectionListeners();
				this.server.find_device(this.getUID()).detachConnectionListeners();
				this.server.find_device(this.getUID()).connection.destroy();
				this.server.find_device(this.getUID()).connection = this.connection;
				this.server.find_device(this.getUID()).attachConnectionListeners();
				this.server.find_device(this.getUID()).make_action(msg_parts.action, msg_parts);
				return;
			}
		}

		/************************************
		 EXECUTE ACTION
		 ************************************/
		let that = this;
		if(msg_parts.action == 'ping' && msg_parts.aData && msg_parts.aData.length){
			let aGPSData = msg_parts.aData;//copy this
			//console.log('multi data array fmb',aGPSData.length);
			async.eachSeries(aGPSData, function(datum, cb){
				msg_parts.data = datum;
				if (that.getUID() == that.logOne) {
                     console.log('multiple msg_parts.data.f_lvl',msg_parts.data.fl,msg_parts.data.f_lvl);
				}
				that.make_action(msg_parts.action, getCopy(msg_parts));
				cb();
			}, function(err){
				if(err){
					console.error('async.eachSeries multiple data fmb',err.message);
				}
			});
		}else{
			this.make_action(msg_parts.action, msg_parts);
		}
	}

	make_action(action, msg_parts) {
		//If we're not logged
		if (action !== "login_request" && !this.loged) {
			this.adapter.request_login_to_device(msg_parts);
			// winston.error(this.model_name, this.getUID(),  " is trying to '" + action + "' but it isn't logged in. Action wasn't executed");
			return false;
		}
		switch (action) {
			case "login_request":
				this.login_request(msg_parts);
				break;
			case "ping":
				this.ping(msg_parts, false);
				break;
			case "alarm":
				this.receive_alarm(msg_parts, false);
				break;
			case "other":
				this.adapter.run_other(msg_parts.cmd, msg_parts);
				break;
		}
	}

	/****************************************
	 LOGIN
	 ****************************************/
	login_request(msg_parts) {

		if (!this.getUID()) {
			 winston.info('login_request without device id',msg_parts.device_id);
			return;
		}

		// Some devices sends a login request before transmitting their position
		// Do some stuff before authenticate the device...

		// Accept the login request. You can set false to reject the device.
		this.login_authorized(true, msg_parts);

		// var existingDevice = servers[options.type].find_device(device_id);   Handle this properly later

		this.server.add_device(this);
		this.getAlarms();
		cassandra.insertServerIpAndStatus(this.getUID(), externalip, this.port, this.model_name);
	}

	login_authorized(val, msg_parts) {
		if (val) {
			this.loged = true;
			this.adapter.authorize(msg_parts);
		}
	}

	/****************************************
	 RECEIVING GPS POSITION FROM THE DEVICE
	 ****************************************/
	ping(data, isParsed, callback) {
		if (this.processingPing){
			//TODO make some process async to avoid loss of packets
			//console.log('already processing',this.getUID(),this.model_name);
			//return;
		} 
		this.processingPing = true;
		this.handlePing(data, isParsed, err => {
			this.processingPing = false;
			if (callback) callback(err);
		});
	}

	handlePing(data, isParsed, callback) {
		const gps_data = isParsed ? data : this.adapter.get_ping_data(data);
		if(this.getUID() == this.logOne){
			console.log('ping from ',this.reg_no,this.getUID(),gps_data.fl,gps_data.f_lvl);
		}
		if (!gps_data || !this.validateGpsData(gps_data)) {
			if (this.logAll || this.getUID() === this.logOne) winston.info("GPS Data can't be parsed. Discarding packet...");
			callback('invalid data');
			return;
		}
		async.series([
			cb => {
				this.initiateLatestLocationIfStopped(gps_data, cb);
			},
			cb => {
				this.fetchAddressIfRequired(gps_data.lat, gps_data.lng, cb);
			},
			cb => {
				this.fetchUserDetails(gps_data, cb);
			},
			cb => {
				this.getTripAlarms(cb);
			},

		], (err, res) => {
			if (err) {
				if (this.logAll || this.getUID() === this.logOne) winston.error('parallel error '+ this.getUID(), err.stack);
				callback(err);
				return;
			}
			this.processPingDataAsync(gps_data).then(error => {
				if(error){
					console.error('on processPingDataAsync '+this.getUID(),error);
                    callback(error);
				}else{
                   // if (this.logAll || this.getUID() === this.logOne) winston.error(gps_data.lat,gps_data.lng);
                    callback();
					if(this.getUID() === this.logOne){
						console.log('f_lvl,m_fact,fl at handlePing',gps_data.f_lvl,this.fuel_sensor_m_fact,gps_data.fl);
					}
					gps_data.user_id = this.user_id;
                    gps_data.model_name = this.model_name;
					gps_data.aGpsgaadi = this.aGpsgaadi;
                    async.parallel([
                        async.reflect(cb => {
                            socketServer.sendPingToAllSockets(JSON.parse(JSON.stringify(gps_data)), this.acc_high, cb);
                        }),
                        async.reflect(cb => {
                            let lmsPingInt = 0;
                            if(this.latestLocation && this.latestLocation.pingToLMS){
                                lmsPingInt = Date.now() - new Date(this.latestLocation.pingToLMS).getTime();
                                lmsPingInt = lmsPingInt/60000;
                            }
							let condC1 = !(this.latestLocation && this.latestLocation.pingToLMS);
							gps_data.user_id = this.user_id;
							gps_data.model_name = this.model_name;
							gps_data.aGpsgaadi = this.aGpsgaadi;
							if(config.lms && config.lms.syncForAll){
								if(this.latestLocation){
									this.latestLocation.pingToLMS = new Date();
								}
								lmsSocketServer.sendPingToAllLmsSockets(JSON.parse(JSON.stringify(gps_data)), this.acc_high, cb);
							}else if(this.latestLocation && ( condC1 || lmsPingInt > 10)){//min
								if(this.latestLocation){
									this.latestLocation.pingToLMS = new Date();
								}
								lmsSocketServer.sendPingToAllLmsSockets(JSON.parse(JSON.stringify(gps_data)), this.acc_high, cb);
							}
                        }),
                        async.reflect(cb => {
                            this.checkForAlarmSettings(JSON.parse(JSON.stringify(gps_data)), cb);
                        })
                    ], (err, res) => {
						if(err){
							console.log('error in process ping data sync',err.message);
						}
						callback();
                    });
				}
			}).catch(err => {
				if(err!='old data') {
					//console.error('on processPingDataAsync '+gps_data.device_id ,err);
				}
				callback(err);
			});
		});
	}

	validateGpsData(gps_data) {
		if(gps_data.gps_tracking == false && this.model_name == 'ais140'){
			//TODO check hardware
			//console.error('gps_tracking 0',gps_data.device_id, new Date(gps_data.datetime));
			return false;
		}
		if(gps_data.lat > 90 || gps_data.lat < - 90){
			return false;
		}
		if(gps_data.lng > 180 || gps_data.lng < - 180){
			return false;
		}
       if (gps_data.lat <= 1 || gps_data.lng <= 1 || gps_data.lat == null || gps_data.lng == null || gps_data.datetime == undefined || gps_data.datetime == null || gps_data.speed == null || gps_data.course == null || gps_data.speed > 140) {
       	//console.error('data in is not valid ',gps_data.device_id, new Date(gps_data.datetime));
       	return false;
		}
        if(gps_data.datetime && new Date(gps_data.datetime).getTime() > (new Date().getTime() + 600000)){//10 early min check
			//TODO check timezone of device
			return false;
		}
		if(gps_data.datetime && ((new Date(gps_data.datetime).getTime() + 14400000) < new Date().getTime())){//3 hrs (3*60*60*1000)
			//console.error('3 or more hr old data ',this.reg_no,this.model_name, gps_data.device_id, new Date(gps_data.datetime));
			if(this.model_name == 'ais140'){
				return false;
			}
           // return false;
        }

		return true;
	}

	initiateLatestLocationIfStoppedAsync(data) {
		return new Promise((resolve, reject) => {
			this.initiateLatestLocationIfStopped(data, (err, res) => {
				if (err) return reject(err);
				resolve(res);
			});
		});
	}

	initiateLatestLocationIfStopped(gps_data, callback) {

		if (this.latestLocation) return callback();
		dbUtils.getAsync(database.table_device_inventory, ['location_time', 'lat', 'lng', 'positioning_time', 'reg_no', 'last_alert_type', 'last_alert_time',
			'address','odo','dist_today','user_id','driver_name','driver_name2','rfid1','rfid2','driver','acc_high','acc_high_time','power_supply','power_supply_time','sens_fl','f_lvl'], {imei: this.getUID()})
			.then(device => {
				device = device[0];

				if ((Date.now() - new Date(device.positioning_time).getTime()) < 10 * 60 * 1000) {
					this.address = device.address;
					this.fetchGoogleAddress = false;
					this.lastAddrTime = new Date(device.location_time).getTime();//Date.now();
				}

				this.reg_no = device.reg_no;
				this.driver = device.driver;//current driver
				this.driver_name = device.driver_name;
				this.driver_name2 = device.driver_name2;
				this.rfid1 = device.rfid1;
				this.rfid2 = device.rfid2;
				this.user_id = device.user_id;
				this.dist_today = device.dist_today || 0;
				this.odo = device.odo || 0;
				this.last_alert_type = device.last_alert_type;
				this.last_alert_time = new Date(device.last_alert_time).getTime();
				if(device.acc_high == true || device.acc_high == false){//avoid null and undefined valued
					this.acc_high = device.acc_high;
					this.acc_high_time = new Date(device.acc_high_time || new Date()).getTime(); 
				}
				if(device.power_supply == true || device.power_supply == false){//avoid null and undefined valued
					this.latestPower = {
						power_supply : device.power_supply,
						start_time : new Date(device.power_supply_time || new Date()).getTime()
					};
					this.power_supply = device.power_supply;
					this.power_supply_time = new Date(device.power_supply_time || new Date()).getTime();

				}
				if(device.sens_fl){
					this.fuel_sensor_m_fact = device.sens_fl;
				}
				if(device.f_lvl){
					this.f_lvl = device.f_lvl;
				}
          		if (!device.location_time) return Promise.resolve();

				if(gps_data.datetime > new Date(device.positioning_time).getTime()){
					//ignore old cache data as it will re calc same dist
					const dist = geozoneCalculator.getDistance({
						latitude: device.lat,
						longitude: device.lng
					}, {
						latitude: gps_data.lat,
						longitude: gps_data.lng
					});
					if (dist < 90) {
						this.latestLocation = getCopy(gps_data);
						this.latestLocation.location_time = new Date(device.location_time).getTime();
						this.latestLocation.halt_location = {
							latitude: device.lat,
							longitude: device.lng
						};
						this.latestLocation.datetime = new Date(device.positioning_time).getTime();
						this.latestLocation.imei = this.getUID();
						this.lastLocationTime = this.latestLocation.datetime;
					}else if(dist < 1300000){ //ignore if device was offline for more than 13000 KM
						//TODO calculate offline dist from map my india
						this.dist_today = this.dist_today + dist;
					}
				}
				//last halt processing end

				if(this.getUID() == this.logOne){
					console.log('initiateLatestLocationIfStopped from',this.reg_no,this.getUID(),this.user_id,this.model_name);
				}
			})
			.catch(err => {
				console.error('initiateLatestLocationIfStopped catch ',err.message);
			})
			.then(() => {
				callback();
			});
	}

	fetchUserDetailsAsync(data) {
		return new Promise((resolve, reject) => {
			this.fetchUserDetails(data, (err, res) => {
				if (err) return reject(err);
				resolve(res);
			});
		});
	}

	fetchUserDetails(gps_data, callback) {
		if (this.aGpsgaadi && this.aGpsgaadi.length) return callback();
		this.aGpsgaadi = [];
		dbUtils.getAsync(database.table_gpsgaadi, ['user_id','reg_no'], {imei: this.getUID()})
			.then(aGpsgaadi => {
				this.aGpsgaadi = aGpsgaadi;
			})
			.catch(err => {
			})
			.then(() => {
				callback();
			});
	}

	processPingDataAsync(gps_data) {
		return new Promise((resolve, reject) => {
			this.processPingData(gps_data, (err, res) => {
				if (err) return reject(err);
				resolve(res);
			});
		});
	}

	processPingData(gps_data, callback) {

       if(!gps_data || !this.validateGpsData(gps_data)){
			console.log(this.getUID(),'invalid GPS data on insertion');
            callback('invalid GPS data on insertion');
            return;
		}
	   //TODO cross check why not updating f_lvl in first place
		if(this.fuel_sensor_m_fact && gps_data.fl && !gps_data.f_lvl){
			gps_data.f_lvl = this.fuel_sensor_m_fact * gps_data.fl;
		}
		gps_data.inserted = Date.now();
		cassandra.insertGPSData(getCopy(gps_data));

        if(this.aGpsgaadi && this.aGpsgaadi.length && gps_data.lat && prepareAPIdata){
			prepareAPIdata(this.aGpsgaadi,gps_data);
		}

		if (gps_data.datetime < this.lastLocationTime) { //Ignore old data as it will break our reports TODO = check
			//console.log('old data ',this.getUID(),new Date(gps_data.datetime));
			if (this.logAll || this.getUID() === this.logOne) winston.error('old data ' + this.getUID() , new Date(gps_data.datetime).toLocaleString(), '<', new Date(this.lastLocationTime).toLocaleString());
			callback('old data');
			return;
		}

		this.lastLocationTime = gps_data.datetime;
		gps_data.positioning_time = gps_data.datetime;

		if (this.latestLocation) {
            gps_data.pingToLMS = this.latestLocation.pingToLMS;
            const dist = geozoneCalculator.getDistance({
				latitude: this.latestLocation.lat,
				longitude: this.latestLocation.lng
			}, {
				latitude: gps_data.lat,
				longitude: gps_data.lng
			});
			const dur = (gps_data.datetime - this.latestLocation.datetime) / 1000;
            if(dur > 0){
                let currentSpeed = dist / dur * 3.6;
                if(currentSpeed >= 1 && !gps_data.speed){
                    currentSpeed = Math.round(currentSpeed);
                    gps_data.speed = gps_data.speed || currentSpeed;
                }
            }
			if (dur > 0 && dist / dur * 3.6 > 160) {
				this.latestLocation = null;
				if (this.logAll || this.getUID() === this.logOne) winston.error('invalid data');
				callback('invalid data for speed');
				return;
			}
			let haltDist;
			if(this.latestLocation.halt_location){
				haltDist = geozoneCalculator.getDistance(this.latestLocation.halt_location, {
					latitude: gps_data.lat,
					longitude: gps_data.lng
				});
			}else{
				gps_data.location_time = gps_data.datetime;
			    gps_data.halt_location = {
				  latitude: gps_data.lat,
				  longitude: gps_data.lng
			    };
			}
			
			if (haltDist && haltDist > 90) {
				gps_data.location_time = gps_data.datetime;
				gps_data.halt_location = {
					latitude: gps_data.lat,
					longitude: gps_data.lng
				};
                this.dist_today += haltDist;
			} else {
				gps_data.location_time = this.latestLocation.location_time;
				gps_data.halt_location = this.latestLocation.halt_location;
				if ((gps_data.datetime - gps_data.location_time) > 180 * 1000) { // if veh did not move for 3 min set speed as zero
					if (this.logAll || this.getUID() === this.logOne) winston.info('speed correction, orig:', gps_data.speed, ' calc:', (haltDist / 1000) / (dur / 3600), ' across:', dur, ' sec');
				}
			}
		} else {
			gps_data.location_time = gps_data.datetime;
			gps_data.halt_location = {
				latitude: gps_data.lat,
				longitude: gps_data.lng
			};
		}
        // current halt processing End
		gps_data.imei = this.getUID();
        //curent acc_high processing
		if(gps_data.ignition == 1 || gps_data.ignition == 0){
			if(gps_data.ignition == 1){
				gps_data.acc_high = true;
			}else if(gps_data.ignition == 0){
				gps_data.acc_high = false;
			}
			this.processAccData(gps_data);
		}

		//current power supply processing
		if(gps_data.power_supply == true || gps_data.power_supply == false ){
			this.processPowerSupplyData(gps_data);
		}

		if(this.odo){
            gps_data.odo = this.odo + this.dist_today;
		}else{
            gps_data.odo = this.dist_today;
		}

		if(this.latestAccHigh && this.latestAccHigh.start_time){
			gps_data.acc_high_time = this.latestAccHigh.start_time;
			gps_data.acc_high = this.latestAccHigh.acc_high;
		}

		if(this.latestPower && this.latestPower.start_time){
			gps_data.power_supply_time = this.latestPower.start_time;
			gps_data.power_supply = this.latestPower.power_supply;
		}

		if(this.f_lvl && gps_data.f_lvl){
			this.processFuelData(getCopy(gps_data));
		}

		this.latestLocation = gps_data;

        this.latestLocation.status = 'online';

        this.latestLocation.dist_today = this.dist_today;

        this.updateDeviceInventory();

		this.processAggregatedDrivesAndStopsReport(getCopy(gps_data));

		callback();
	}

	fetchLocation(from) {
		if (this.logAll || this.getUID() === this.logOne) winston.info('fetchLocation from', from, (Date.now() - this.lastLocationTime) < 50 * 1000 ? 'no need' : 'done');
		if ((Date.now() - this.lastLocationTime) < 120000) return;//4 min interval no fetch location
		if(this.model_name == 'tr02' ||  this.model_name == 'tr06' || this.model_name == 'crx' || this.model_name == 'vt2' || this.model_name == 'tr06n'  || this.model_name == 'tr06f'){
			this.adapter.get_location();
		}
		
	}

	/****************************************
	 RECEIVING ALARM
	 ****************************************/
	receive_alarm(data, isParsed, extra) {
		if (!data) return;
		let alarm_code, oGPSData;
		if (isParsed) {
			alarm_code = data;
		} else {
			oGPSData = this.adapter.receive_alarm(data);
			if (oGPSData && oGPSData.alarm_terminal) {
				alarm_code = oGPSData.alarm_terminal;
			}
		}
		if (!alarm_code) return;
		if (Object.keys(alarms).indexOf(alarm_code) < 0) return;
		let dttime;
		if (oGPSData && oGPSData.location && oGPSData.location.datetime) {
			dttime = new Date(oGPSData.location.datetime);
		} else {
			dttime = new Date();
			dttime.setMilliseconds(0);
			dttime.setSeconds(0);
		}

		let that = this;
		const alarm = {
			imei: this.getUID(),
			reg_no: this.reg_no,
			user_id: this.user_id,
			code: alarm_code,
			msg: alarms[alarm_code],
			datetime: dttime.getTime(),
			driver: this.driver || this.driver_name || this.driver_name2,
			model_name: that.model_name
		};
		if (this.logAll || this.getUID() === this.logOne) winston.info('receive_alarm ', JSON.stringify(alarm));

		if (alarm_code == 'rfid') {
			if (this.rfid1 == extra) {
				alarm.driver = this.driver_name;
			} else if (this.rfid2 == extra) {
				alarm.driver = this.driver_name2;
			}
		}

		if (extra) {
			alarm.extra = extra;
			alarm.msg += (' : ' + extra);
		}

		//TODO fix locations it should be fetched for that time
		if (oGPSData && oGPSData.location && oGPSData.location.datetime) {
			alarm.location = oGPSData.location;
		}else if (this.latestLocation) {
			//TODO fetch location of alarm while it was happened for history packet
			alarm.location = {
				lat: this.latestLocation.lat,
				lng: this.latestLocation.lng,
				datetime: this.latestLocation.datetime,
				address: this.latestLocation.address,
				speed: this.latestLocation.speed,
				course: this.latestLocation.course
			};
		}

		if (alarm.code == 'sos' && this.last_alert_type && this.last_alert_type === alarm.code && (alarm.datetime - this.last_alert_time) < 2 * 60 * 1000) {
			console.log('duplicate alerts SOS', this.reg_no);
			return;
		}
		that.last_alert_type = alarm.code;
		that.last_alert_time = alarm.datetime;
		dbUtils.update(database.table_device_inventory, {
			imei: alarm.imei,
			last_alert_type: alarm.code,
			last_alert_time: alarm.datetime,
			driver: alarm.driver
		}, () => {
		}, () => {
		});
		if(!alarm.location){
			return;
		}
		addressService.upsertAlerts(alarm, (err, resp) => {
			if (err) {
				console.error('upsertAlerts error', err);
			}
			let oNotif = {
				"include_external_user_ids": [alarm.user_id],
				"contents": {
					"en": alarm.msg
				},
				"data": {
					reg_no: alarm.reg_no,
					user_id: alarm.user_id,
				},
				"name": alarm.code
			};
			oneSignalNotification.sendOneSignalNotification(oNotif);
		});
		if(config.lms && config.lms.userAllowedForTripForAll){
			//emailService.sendAlertMails(getCopy(alarm));
		}else if(config.lms && config.lms.userAllowedForTrip && config.lms.userAllowedForTrip.length){
			if(config.lms.userAllowedForTrip.indexOf(that.user_id ) > -1){
				//emailService.sendAlertMails(getCopy(alarm));
			}
		}
	}
    /****************************************
     RECEIVING receive others sos like
     ****************************************/
    receive_others(data, isParsed, extra) {
    	 const alarm_code = isParsed ? data : this.adapter.receive_others(data);

        if (!alarm_code) return;
        if (Object.keys(alarms).indexOf(alarm_code) < 0) return;

        const alarm = {
            imei: this.getUID(),
            code: alarm_code,
            msg: alarms[alarm_code],
            datetime: Date.now()
        };

        if (extra) {
            alarm.extra = extra;
            alarm.msg += (' : ' + extra);
        }

        if (this.latestLocation) {
            alarm.location = {
                lat: this.latestLocation.lat,
                lng: this.latestLocation.lng,
                datetime: this.latestLocation.datetime,
                address: this.latestLocation.address,
                speed: this.latestLocation.speed,
                course: this.latestLocation.course
            };
        }

        dbUtils.update(database.table_device_inventory, {
            imei: alarm.imei,
            last_alert_type: alarm.code,
            last_alert_time: alarm.datetime,
			status:'online',
			positioning_time:Date.now()
        }, () => {
        });

        if (alarm.code !='sos' && this.last_alert_type && this.last_alert_type === alarm.code && (alarm.datetime - this.last_alert_time) < 60 * 60 * 1000) {
            this.last_alert_type = alarm.code;
            this.last_alert_time = alarm.datetime;
        } else {
            this.last_alert_type = alarm.code;
            this.last_alert_time = alarm.datetime;
        }

    }

	/****************************************
	 RECEIVING HANDSHAKE
	 ****************************************/
	receive_handshake(msg_parts) {
		const handshake_data = this.adapter.receive_handshake(msg_parts);

		if (handshake_data.acc_high == true || handshake_data.acc_high == false) {
			this.processAccData(getCopy(handshake_data));
			let oDev = {
				imei : this.getUID(),
				acc_high : handshake_data.acc_high,
				gsm_signal_str:handshake_data.gsm_signal_str
			};
			if(this.latestAccHigh && this.latestAccHigh.start_time){
				oDev.acc_high_time = this.latestAccHigh.start_time;
				//console.log('no acc_high_time',this.getUID(),this.model_name);
			}
			deviceService.updateDeviceInventory(oDev, (err, res) => {
			});
		}else{
		      //for tr02
		      cassandra.insertDeviceStatusOnly(this.getUID(),'online');
		}
	}

	/****************************************
	 COMMANDS
	 ****************************************/

	receive_string_info(msg_parts) {
		const command_data = this.adapter.receive_string_info(msg_parts);

		if (!command_data.command_type) return;

		if (command_data.command_type === 'location') {
			if (!command_data.data) return;
			if (this.logAll || this.getUID() === this.logOne) winston.info(this.processingPing, 'processPingData from get Location', JSON.stringify(command_data.data));
			if(this.model_name != 'tk103'){
				this.ping(command_data.data, true);
			}else{
				console.log(this.model_name + "receive_string_info prevent ping " + this.getUID())
			}
		}
		cassandra.insertDeviceStatusOnly(this.getUID(),'online');
		socketServer.sendCommandToAllSockets(getCopy(command_data), this);
	}

	send(msg) {
		if (config.isDevelopServer) return;
		this.connection.write(msg);
		if (this.getUID() == this.logOne) {
			winston.info("Sending to " + this.getUID() + ": " + msg.toString('hex') + ":" + msg);
		}
	}

	send_byte_array(array) {
		const buff = new Buffer(array);
	}

	fetchAddressIfRequired(lat, lng, callback) {
		let shouldFetchAddr = false;
		if ((Date.now() - this.lastAddrTime) > 7 * 60 * 1000) shouldFetchAddr = true;
		if (this.address && this.latestLocation && (Date.now() - this.latestLocation.positioning_time) > 30 * 60 * 1000) shouldFetchAddr = true;
		if (!this.address || this.address=="" || this.address=="NA") shouldFetchAddr = true;
		if (!shouldFetchAddr) return callback();
        //if(true){//fetch for all from same server
		let that = this;
		if(this.model_name == 'tk103' || this.model_name == 'ks199'){
			let oSettings =   {
				lat :lat,
				lng:lng,
				imei:this.getUID() || "NA"
			};	
		addressService.getAddressFromGeographyV2Async(oSettings).then(addr => {
			that.address = addr;
			that.fetchGoogleAddress = false;
			that.lastAddrTime = Date.now();
            callback();
        }).catch(err => {
            callback(err);
        });
        }else{
            addressService.getAddressAsync(lat, lng).then(addr => {
                that.address = addr;
                that.fetchGoogleAddress = false;
                that.lastAddrTime = Date.now();
                callback();
            }).catch(err => {
                callback(err);
            });
        }
	}

	updateDeviceInventory() {
		if (!this.latestLocation || !this.latestLocation.lat || !this.latestLocation.lng || !this.latestLocation.location_time) {
			return;  // device goes offline while fetching address before updating inventory
		}
		this.latestLocation.address = this.address;
	
        if(this.server && this.server.find_device(this.getUID()) && this.server.find_device(this.getUID()).dist_today){
            this.latestLocation.dist_today = this.server.find_device(this.getUID()).dist_today;
            this.dist_today =  this.latestLocation.dist_today;
		}
		if(isNaN(this.latestLocation.dist_today)){
        	delete this.latestLocation.dist_today;
        	console.log('dist_today isNaN',this.getUID());
		}
		if(this.latestLocation.dist_today > 1000000){//700 KM or not a no
        	console.log('dist_today is more than 1000 KM',this.getUID(),this.latestLocation.dist_today);
			let that = this;
			setDistToCurrent.updateDistanceToday(this.getUID(),undefined,function(err,resp){
				console.log(that.getUID(),'reset of dist today done',that.latestLocation.dist_today,that.dist_today);
			});
		}
		deviceService.updateDeviceInventory(this.latestLocation, (err, res) => {
		});
	}

	processAggregatedDrivesAndStopsReport(data, forceInsert) {
		if (!this.latestLocation) return;
		if (!this.latestADASEntry) {
			this.latestADASEntry = {};
			this.idle = this.acc_high;
			this.latestADASEntry.imei = this.getUID();
			this.latestADASEntry.start_time = data.datetime;
			this.latestADASEntry.drive = data.speed !== 0;
			this.latestADASEntry.start = {
				latitude: data.lat,
				longitude: data.lng
			};
			this.latestADASEntry.prev = {
				latitude: data.lat,
				longitude: data.lng
			};
			this.latestADASEntry.distance = 0;
			this.latestADASEntry.top_speed = data.speed;
			this.latestADASEntry.fetchGoogleAddress = data.fetchGoogleAddress;
			this.latestADASEntry.start_addr = this.address;
		} else {
			const distance = geozoneCalculator.getDistance(this.latestADASEntry.prev, {
				latitude: data.lat,
				longitude: data.lng
			});
			const duration = data.datetime - this.latestADASEntry.start_time;
			if (duration > 0) {
				const drive = this.latestADASEntry.drive;
				const speed = data.speed;
				this.latestADASEntry.distance += distance;
				this.latestADASEntry.prev = {
					latitude: data.lat,
					longitude: data.lng
				};
				if (this.latestADASEntry.drive) {
					this.latestADASEntry.top_speed = data.speed > this.latestADASEntry.top_speed ? data.speed : this.latestADASEntry.top_speed;
				}
				if ((drive && speed === 0) || (!drive && speed !== 0) || forceInsert) {
					this.latestADASEntry.duration = duration / 1000;
					this.latestADASEntry.end_time = data.datetime;
					this.latestADASEntry.stop = {
						latitude: data.lat,
						longitude: data.lng
					};
					if (duration > 300 && this.latestADASEntry.distance < 100) {
						this.latestADASEntry.drive = false;
					}
					this.latestADASEntry.fetchGoogleAddress = data.fetchGoogleAddress;
					this.latestADASEntry.stop_addr = this.address;
					this.latestADASEntry = null;
					data.fetchGoogleAddress = false;
					this.processAggregatedDrivesAndStopsReport(data);
				}
			}
		}
	}

	processAccData(data) {
		//detect chnage in  acc_high value
		if (!this.latestLocation) return;
		if (!this.latestAccHigh) {
			this.latestAccHigh = {};
			if(this.acc_high == true || this.acc_high == false){
				//TODO check for old packate flushed by memory
				//if ((data.datetime - gps_data.location_time) > 180 * 1000) { 
				this.latestAccHigh.acc_high = this.acc_high;
				if(this.acc_high_time){
					this.latestAccHigh.start_time = new Date(this.acc_high_time).getTime();
					this.acc_high_time = this.latestAccHigh.start_time;
			        data.acc_high_time = this.latestAccHigh.start_time;
				}else{
					//TODO check its impact
					this.latestAccHigh.start_time = data.datetime;
				}
			}		
		} else if ((this.acc_high == true || this.acc_high == false ) && (this.latestAccHigh.acc_high !== data.acc_high)) {
			const duration = data.datetime - this.latestAccHigh.start_time;
			this.latestAccHigh.duration = duration / 1000;
			this.latestAccHigh.end_time = data.datetime;
			this.acc_high = data.acc_high;//initialize
			this.latestAccHigh.start_time = data.datetime;
			this.acc_high_time = data.datetime;
			data.acc_high_time = data.datetime;
			if(this.model_name == "atlanta_e101" && this.latestAccHigh.duration > 3000){
				this.latestAccHigh.imei =  this.getUID();
				cassandra.upsertAccReportEntry(getCopy(this.latestAccHigh), this.model_name, this.getUID());
			}
		}
	}

	processPowerSupplyData(data) {
		//detect chnage in  power_supply value
		if (!this.latestLocation) return;
		if (!this.latestPower) {
			this.latestPower = {};
			if(this.power_supply == true || this.power_supply == false){
				//TODO check for old packate flushed by memory
				//if ((data.datetime - gps_data.location_time) > 180 * 1000) {
				this.latestPower.power_supply = this.power_supply;
				if(this.power_supply_time){
					this.latestPower.start_time = new Date(this.power_supply_time).getTime();
					this.power_supply_time = this.latestPower.start_time;
					data.power_supply_time = this.latestPower.start_time;
				}else{
					//TODO check its impact
					this.latestPower.start_time = data.datetime;
				}
			}
		} else if ((this.power_supply == true || this.power_supply == false ) && (this.latestPower.power_supply !== data.power_supply)) {
			const duration = data.datetime - this.latestPower.start_time;
			this.latestPower.duration = duration / 1000;
			this.latestPower.end_time = data.datetime;
			this.power_supply = data.power_supply;//initialize
			this.latestPower.start_time = data.datetime;
			this.power_supply_time = data.datetime;
			data.power_supply_time = data.datetime;
			this.latestPower.imei =  this.getUID();
			this.updateBooleanReportsForPowerSupply(getCopy(this.latestPower));
		}
	}

	processFuelData(data){
		//todo check with duration
     	let dur = (data.datetime - this.latestLocation.datetime) / 1000;
		 if(dur < 1200){//20*60 20 min
			 //check only for
			 let diffLvl =  data.f_lvl - this.f_lvl;
			 if(diffLvl > 5){
				 //refilling
				 console.log('Fuel refilling ' + this.reg_no + " " + diffLvl);
			 }else if(diffLvl < -5){
				 console.log('Fuel Draining ' + this.reg_no + " " + diffLvl);
			 }
		 }
		this.f_lvl = data.f_lvl;
	}

	handleDisconnection() {
		if(this.getUID()){
			if(this.getUID() == this.logOne){
				console.log('handleDisconnection',this.getUID());
			}
            cassandra.updateStatusReport(this.getUID(), false, Date.now());
            socketServer.deviceDisconnected(this.getUID());
            this.server.remove_device(this.getUID());
		}else{
			console.log('no imei on disconnect ',this.getUID());
		}
   }

	forceInsertData(datetime) {
		if (!this.latestLocation) return;
		if (this.latestADASEntry) {
			this.processAggregatedDrivesAndStopsReport({
				datetime: datetime,
				lat: this.latestLocation.lat,
				lng: this.latestLocation.lng,
				speed: this.latestLocation.speed,
				course: this.latestLocation.course
			}, true);
		}
	}

	markAsOffline() {
		cassandra.markAsOffline(this.getUID());
	}

	getIsGeofenceEvents() {
		dbUtils.getAsync(database.table_is_geofence_event).then(ige => {
			this.is_geofence_event = {};
			for (let i = 0; i < ige.length; i++) {
				if (!this.is_geofence_event[ige[i].user_id]) this.is_geofence_event[ige[i].user_id] = {};
				this.is_geofence_event[ige[i].user_id][new Date(ige[i].created_at).getTime()] = ige[i];
			}
		}).catch(err => {
			console.log('getIsGeofenceEvents:', err.stack);
		});
	}

	getAlarms(done) {
		alarmService.getAlarmForDeviceAsync(this.getUID()).then(alarms => {
			this.alertSettings = {};
			for (let i = 0; i < alarms.length; i++) {
				if (this.alertSettings[alarms[i].atype]) {
					this.alertSettings[alarms[i].atype].push(alarms[i]);
				} else {
					this.alertSettings[alarms[i].atype] = [alarms[i]];
				}
			}
			if(this.getUID() == this.logOne){
				console.log(' getAlarms geofence for ' + this.logOne,(this.alertSettings.geofence && this.alertSettings.geofence.length));
			}
		}).catch(err => {
		}).then(() => {
			if (done) done();
		});
	}

	getTripAlarms(done) {
		if(done && this.tripAlertSettings && this.tripAlertSettings.length){
			return done();
		}
		let that = this;
		let bUserCond = false;

	 if(config.lms && config.lms.userAllowedForTripForAll){
		 bUserCond = true;
	 }else if(this.aGpsgaadi) {
			for (let g = 0; g < this.aGpsgaadi.length; g++) {
				let uid = this.aGpsgaadi[g].user_id;
				if (config.lms && config.lms.userAllowedForTrip && config.lms.userAllowedForTrip.length) {
					if (config.lms.userAllowedForTrip.indexOf(uid) > -1) {
						bUserCond = true;
						break;
					}
				}
			}
		}

        if(bUserCond){
	        lmsDbService.getGeofencesAsync(this.getUID())
                .then(geofence_points => {
                    if (!geofence_points) throw new Error('no geofence_points');
					that.tripAlertSettings = [];
					if(geofence_points && geofence_points[0] && geofence_points[0].user_id){
						that.user_id = geofence_points[0].user_id;
					}else{
						console.error('no gpsId found',that.user_id);
					}
					//console.log('geofence_points found for trip alarm',this.user_id,this.getUID(),geofence_points.length);
                    for (let i = 0; i < geofence_points.length; i++) {
                        if (!geofence_points[i].geozone) continue;
                        geofence_points[i].ptype = 'circle';
                        geofence_points[i].user_id = that.user_id;
                        geofence_points[i].imei = this.getUID();
                        delete geofence_points[i].geozone[0]._id;
						that.tripAlertSettings.push(geofence_points[i]);
                    }
                }).catch(err => {
            }).then(() => {
                if (done) done();
            });
		}else{
            if (done) done();
		}

	}

    checkForAlarmSettings(data, callback) {
        if (this.latestLocation && this.alertSettings && this.alertSettings.geofence) {
            this.findEligibleGeozones(data, () => {
            });
        }

        if (this.latestLocation && this.tripAlertSettings && this.tripAlertSettings.length) {
            this.findEligibleLmsGeozones(data, () => {
            });
        }

        if (this.latestLocation && this.alertSettings && this.alertSettings.over_speed) {
            this.findEligibleOverSpeeds(data);
        }
		if (config.enableHaltAlert && this.latestLocation && this.alertSettings && this.alertSettings.halt) {
			this.findEligibleHalts();
		}
        if (callback) callback();
    }

	isGeofenceEventAsync(oAlarm, oPing) {
		return new Promise((resolve, reject) => {
			this.isGeofenceEvent(oAlarm, oPing, (err, res) => {
				if (err) return reject(err);
				resolve(res);
			});
		});
	}

	isGeofenceEvent(oAlarm, oPing, callback) {
		let reqd_loc_buffer = 2;
		let is_inside = false;

		if (!oAlarm.location_buffer) oAlarm.location_buffer = [];

		const point = {
			latitude: oPing.lat,
			longitude: oPing.lng
		};

		if (oAlarm.ptype === 'polygon' || oAlarm.ptype === 'rectangle') {
			//is_inside = geozoneCalculator.isPointInside(point, oAlarm.geozone);
			is_inside = PointInPolygon.isPointInPolygon(point, oAlarm.geozone);
		} else {
			is_inside = geozoneCalculator.isPointInCircle(point, oAlarm.geozone[0], oAlarm.radius);
		}
		if(this.getUID() == this.logOne){
			console.log('check for is_inside',is_inside,this.logOne,point,oAlarm.geozone);
		}
		

		let shouldUpdate = true;

		let entry = false, exit = false;

		const geofence_status = {
			datetime: oPing.datetime,
			lat: oPing.lat,
			lng: oPing.lng,
			course: oPing.course
		};
		if (oAlarm.is_inside === undefined || oAlarm.is_inside === null) {
			oAlarm.is_inside = is_inside;
			oAlarm.location_buffer = [];
            if(this.getUID() == this.logOne){
                console.log('oAlarm.is_inside', oAlarm.is_inside,is_inside);
            }
		} else if (is_inside !== oAlarm.is_inside) {
			if (oAlarm.location_buffer.length >= reqd_loc_buffer) {
				entry = is_inside;
				exit = !entry;
                oAlarm.is_inside = entry;
                oAlarm.location_buffer = [];
                if(this.getUID() == this.logOne){
                    console.log('is_inside !== oAlarm.is_inside', oAlarm.is_inside,is_inside);
                }
			} else {
                oAlarm.location_buffer.push(geofence_status);
                if(this.getUID() == this.logOne){
                    console.log('oAlarm.location_buffer', oAlarm.location_buffer);
                }
			}
		} else {
			shouldUpdate = false;
		}

		if (shouldUpdate) {
			if(this.getUID() == this.logOne){
				console.log('shouldUpdate table_Alarm update ', oAlarm.is_inside,entry,exit);
			}
		         dbUtils.update(database.table_Alarm, {
                    user_id: oAlarm.user_id,
                    created_at: oAlarm.created_at,
                    is_inside: oAlarm.is_inside,
                    location_buffer: oAlarm.location_buffer
                }, (err, res) => {
                    if (err) winston.error('updateAlarm err gpsdevice.js 1673');
                if (!err) {
                    console.log(oAlarm.vehicle_no + " is_inside " +oAlarm.is_inside);
                   // if(!this.is_geofence_event[user_id]) this.is_geofence_event[user_id] = {};
                   // this.is_geofence_event[user_id][new Date(created_at).getTime()] = ige;
                }
                //this.fetchLocation('alarmService');//TODO why to fetch location here?
            });
        }

		if (!entry && !exit) return callback('not geofence event'); //return callback(new Error('not geofence event'));
        oAlarm.entered = is_inside;
        callback(null, oAlarm);
	}

    isGeofenceEventLmsAsync(oAlarm, oPing) {
        return new Promise((resolve, reject) => {
            this.isGeofenceEventLms(oAlarm, oPing, (err, res) => {
                if (err) return reject(err);
                resolve(res);
            });
        });
    }

    isGeofenceEventLms(oAlarm, oPing, callback) {
		let that = this;
        let reqd_loc_buffer = 2;
        let is_inside = false;

        if (!oAlarm.location_buffer) oAlarm.location_buffer = [];

        const point = {
            latitude: oPing.lat,
            longitude: oPing.lng
        };

        if (oAlarm.ptype === 'polygon') {
            is_inside = geozoneCalculator.isPointInside(point, oAlarm.geozone);
        } else {
            is_inside = geozoneCalculator.isPointInCircle(point, oAlarm.geozone[0], oAlarm.radius);
        }

        let shouldUpdate = true;

        let entry = false, exit = false;

        const geofence_status = {
            datetime: oPing.datetime,
            lat: oPing.lat,
            lng: oPing.lng,
            course: oPing.course,
            address : oPing.address,
            imei:oPing.imei,
			odo:oPing.odo,
			speed:oPing.speed
        };
        let isEvent;
        if (oAlarm.is_inside === undefined || oAlarm.is_inside === null) {
			console.error('oAlarm.is_inside === null', oAlarm.is_inside);
            oAlarm.is_inside = is_inside;
			oAlarm.isEvent = false;
            oAlarm.location_buffer = [];
        } else if (is_inside != oAlarm.is_inside) {
        	console.log(is_inside,oAlarm.is_inside,is_inside != oAlarm.is_inside,'1');
            if (oAlarm.location_buffer.length >= reqd_loc_buffer) {
                entry = is_inside;
                exit = !entry;
                oAlarm.is_inside = entry;
                oAlarm.location_buffer = [];
                isEvent = true;
				oAlarm.isEvent = true;
                geofence_status.entry = entry;
            } else {
				oAlarm.isEvent = false;
                oAlarm.location_buffer.push(geofence_status);
            }
        } else {
            shouldUpdate = false;
        }
		oAlarm.entered = is_inside;
        if (shouldUpdate) {
			callback(null, oAlarm);
            let modify = {
                is_inside: oAlarm.is_inside,
                location_buffer: oAlarm.location_buffer
            };
            if(isEvent) {
            	modify.events = geofence_status;
            }
		   if(oAlarm.geofence_type == 'TRIP' || oAlarm.geofence_type == 'Trip'){
				modify.request_id = oPing.datetime;
                lmsDbService.updateTripGeofences(oAlarm._id,modify,function(err,resp){
					if(resp && resp.message == 'reCheckTripGeofence'){
                       that.getTripAlarms();
					}
				});
			}
        }else{
			if (!entry && !exit) return callback(new Error('not geofence event'));
			callback(null, oAlarm);
		}
    }

	findEligibleGeozones(data, callback) {
		const oPing = {
			lat: data.lat,
			lng: data.lng,
			imei: data.device_id,
			atype: 'geofence',
			speed: data.speed,
			datetime: data.datetime,
			course: data.course,
            address:this.address
		};

		async.each(this.alertSettings.geofence, (oAlarm, done) => {
            if (oAlarm.atype !== 'geofence' || oAlarm.enabled !== 1) return done();
            oAlarm.customShcedule = false;
            oAlarm.defaultShcedule = false;
            if(oAlarm.custom_schedules && oAlarm.custom_schedules[0] && oAlarm.custom_schedules[0].start){
              if(dateUtils.getDDMMYYYY(oAlarm.custom_schedules[0].start) == dateUtils.getDDMMYYYY(new Date())){
                  //if current date matches with schedule date
                  for(let i=0;i<oAlarm.custom_schedules.length;i++){
                      let start = new Date(oAlarm.custom_schedules[i].start).getTime();
                      let end = new Date(oAlarm.custom_schedules[i].end).getTime();
                      if(start <= Date.now() && Date.now() <= end){
                          oAlarm.customShcedule = true;
                          oAlarm.entry_msg = oAlarm.custom_schedules[i].msg;
                          oAlarm.exit_msg = oAlarm.custom_schedules[i].msg;
                          break;
                      }
                  }
                  if(!oAlarm.customShcedule) return done();
              }
             }
            if(!oAlarm.customShcedule && oAlarm.schedules && oAlarm.schedules[0]){
                for(let i=0;i<oAlarm.schedules.length;i++){
                    let start = new Date(oAlarm.schedules[i].start);
                    let end = new Date(oAlarm.schedules[i].end);
                    let startTime = new Date();
                    startTime.setHours(start.getHours());
                    startTime.setMinutes(start.getMinutes());
                    let endTime = new Date();
                    endTime.setHours(end.getHours());
                    endTime.setMinutes(end.getMinutes());
                    if(startTime.getTime() <= Date.now() && Date.now() <= endTime.getTime()){
                        oAlarm.defaultShcedule = true;
                        oAlarm.entry_msg = oAlarm.schedules[i].msg;
                        oAlarm.exit_msg = oAlarm.schedules[i].msg;
                        break;
                    }
                }
                if(!oAlarm.defaultShcedule) return done();
            }

			oAlarm.device_type = this.model_name;
			oAlarm.datetime = oPing.datetime;
           this.isGeofenceEventAsync(oAlarm, oPing).then(objAlarm => {
				for(let i=0;i<this.alertSettings.geofence.length;i++){
					if(this.alertSettings.geofence[i].user_id == objAlarm.user_id && this.alertSettings.geofence[i].created_at == objAlarm.created_at){
                        this.alertSettings.geofence[i]=objAlarm;
						if(this.getUID() == this.logOne){
							console.log('in compare findEligibleGeozones ',this.reg_no,oAlarm.name,oAlarm.entered);
				}
					}
		        }
				oAlarm = objAlarm;
				oPing.exit = !oAlarm.entered;
                alarmService.generateMessage(oAlarm, oAlarm.entered);
			   let oNotif = {
				   "include_external_user_ids": [this.user_id],
				   "contents": {
					   "en": oAlarm.message
				   },
				   "data": {
					   reg_no: this.reg_no,
					   user_id: this.user_id,
				   },
				   "name": "Geofence Alert"
			   };
			   oneSignalNotification.sendOneSignalNotification(oNotif);
		}).catch(err => {
			if(err && err =='not geofence event'){
              //NO logging
			}else{
				//console.error('isGeofenceEventAsync catch',err);
			}
			done();
			});
		}, err => {
			//console.error('findEligible async each Geozones catch',err);
			callback();
		});
	}

    findEligibleLmsGeozones(data, callback) {
		let that = this;
        const oPing = {
            lat: data.lat,
            lng: data.lng,
            imei: data.device_id,
            atype: 'geofence',
            speed: data.speed,
            datetime: data.datetime,
            course: data.course,
            address:this.address,
			odo : this.odo + this.dist_today
        };

        async.each(that.tripAlertSettings, (oAlarm, done) => {
            if (oAlarm.deleted) return done();
            oAlarm.device_type = this.model_name;
            oAlarm.datetime = oPing.datetime;
            this.isGeofenceEventLmsAsync(oAlarm, oPing).then(objAlarm => {
                for(let i=0;i<that.tripAlertSettings.length;i++){
                    if(that.tripAlertSettings[i]._id == objAlarm._id){
                        that.tripAlertSettings[i] = objAlarm;
                    }
                }
				//go to next iteration
				if(done) done();
                oAlarm = objAlarm;
                oPing.exit = !oAlarm.entered;
				if(objAlarm.isEvent){
					//start save alert
					const alarm = {
						imei: data.device_id || this.getUID(),
						reg_no: this.reg_no,
						user_id: oAlarm.user_id || this.user_id,
						datetime: new Date(data.datetime),
						model_name: this.model_name,
						location: {
							lat: data.lat || this.latestLocation.lat,
							lng: data.lng || this.latestLocation.lng,
							address:oAlarm.name || this.address || this.latestLocation.address,
							speed: data.speed || this.latestLocation.speed,
							course: data.course || this.latestLocation.course
						}
					};
					if(oAlarm.is_inside){
						alarm.code = 'entry';
						alarm.msg = this.reg_no + " entered into geofence " + oAlarm.name;
					}else{
						alarm.code = 'exit';
						alarm.msg = this.reg_no + " exit from geofence " + oAlarm.name;
					}
					addressService.upsertAlerts(alarm, (err, resp) => {
						if (err) {
							console.error('upsertAlerts error', err);
						}
						let oNotif = {
							"include_external_user_ids": [that.user_id],
							"contents": {
								"en": alarm.msg
							},
							"data": {
								reg_no: that.reg_no,
								user_id: that.user_id,
							},
							"name": "Geofence Alert"
						};
						oneSignalNotification.sendOneSignalNotification(oNotif);
					});
				}
            }).catch(err => {
                if(done) done();
            });
        }, err => {
			if(err){
				console.error('findEligibleLmsGeozones error ',err.message);
			}
            callback();
        });
    }

	findEligibleOverSpeeds(data) {
		let that = this;
		const oPing = {
			lat: data.lat,
			lng: data.lng,
			imei: data.device_id,
			atype: 'geofence',
			speed: data.speed,
			datetime: data.datetime,
			course: data.course
		};
		for (let i = 0; i < this.alertSettings.over_speed.length; i++) {
			const oAlarm = this.alertSettings.over_speed[i];
			oAlarm.device_type = this.model_name;
			oAlarm.datetime = data.datetime;
			if (this.alertSettings.over_speed[i].over_speed <= data.speed) {
				oAlarm.message = oAlarm.vehicle_no + " is exceeded speed limit of " + oAlarm.over_speed + " KM/H with current speed of " + data.speed + " KM/H";
				if (parseInt(Date.now() - this.lastOverspeed) >= 3600000 && data.speed > 50 && data.speed < 130) { //last over speed time should be more than 1 Hr.
					oAlarm.sendSMS = true;
					this.lastOverspeed = Date.now();
					const alarm = {
						code:'over_speed',
						imei: data.device_id || this.getUID(),
						reg_no: that.reg_no,
						user_id: that.user_id,
						datetime: new Date(data.datetime),
						model_name: that.model_name,
						location: {
							lat: data.lat || that.latestLocation.lat,
							lng: data.lng || that.latestLocation.lng,
							address:  that.address || that.latestLocation.address,
							speed: data.speed || this.latestLocation.speed,
							course: data.course || this.latestLocation.course
						}
					};
					addressService.upsertAlerts(alarm, (err, resp) => {
						if (err) {
							console.error('upsertAlerts error', err);
						}
						let oNotif = {
							"include_external_user_ids": [that.user_id],
							"contents": {
								"en": oAlarm.msg
							},
							"data": {
								reg_no: that.reg_no,
								user_id: that.user_id,
							},
							"name": "Overspeed Alert"
						};
						oneSignalNotification.sendOneSignalNotification(oNotif);
					});
				}
			}
		}
	}

	isHaltEventAsync(device_halt_dur, haltAlarm) {
		return new Promise((resolve, reject) => {
			this.isHaltEvent(device_halt_dur, haltAlarm, (err, res) => {
				if (err) return reject(err);
				resolve(res);
			});
		});
	}

	isHaltEvent(device_halt_dur, haltAlarm, callback) {
		let s_hlt_dur, l_rec_dur;
		if (haltAlarm.halt_duration) {
			s_hlt_dur = haltAlarm.halt_duration;
			l_rec_dur = 60;  // 1 hr
		} else {
			s_hlt_dur = 60;
		}
		if (device_halt_dur < s_hlt_dur) return callback(new Error('no event'));
		if (haltAlarm.last_received_time && (Date.now() - new Date(haltAlarm.last_received_time).getTime()) < 60 * 60 * 1000) return callback('no event');

		if ((device_halt_dur - s_hlt_dur) < 10) return callback();
		if ((device_halt_dur % l_rec_dur) < 10) return callback();
		callback(new Error('no event'));
	}

	findEligibleHalts() {
		let device_halt_dur = 0; //minutes
		if (this.latestLocation && this.latestLocation.positioning_time && this.latestLocation.location_time) {
            device_halt_dur = Date.now() - new Date(this.latestLocation.location_time).getTime();
            device_halt_dur = device_halt_dur / 60000; // in minutes
        }
        let that = this;
		if (!this.alertSettings || !this.alertSettings.halt) return;

		for (let i = 0; i < this.alertSettings.halt.length; i++) {
			let haltAlert = this.alertSettings.halt[i];

			this.isHaltEventAsync(device_halt_dur, haltAlert).then(() => {
				haltAlert.message = "vehicle " + haltAlert.vehicle_no + "  was stopped from last " + dateUtils.getDurationFromSecs(device_halt_dur * 60);
				let alarm = {
					imei: haltAlert.imei || that.getUID(),
					reg_no: that.reg_no,
					user_id: that.user_id,
					code: 'halt',
					msg: haltAlert.message,
					datetime: Date.now(),
					driver: that.driver || that.driver_name || that.driver_name2,
					model_name: that.model_name
				};
				if (that.latestLocation) {
					alarm.location = {
						lat: that.latestLocation.lat,
						lng: that.latestLocation.lng,
						datetime: that.latestLocation.datetime,
						address: that.latestLocation.address,
						speed: that.latestLocation.speed,
						course: that.latestLocation.course
					};
					addressService.upsertAlerts(alarm, (err, resp) => {
						if (err) {
							console.error('upsertAlerts error', err);
						}
						let oNotif = {
							"include_external_user_ids": [this.user_id],
							"contents": {
								"en": haltAlert.message
							},
							"data": {
								reg_no: that.reg_no,
								user_id: that.user_id,
							},
							"name": "Halt Alert"
						};
						oneSignalNotification.sendOneSignalNotification(oNotif);
					});
				}
				//one signal ends
				haltAlert.last_location_time = this.latestLocation.location_time;
				haltAlert.last_received_time = Date.now();
				const oUpdate = {
					user_id: haltAlert.user_id,
					last_location_time: this.latestLocation.location_time,
					created_at: haltAlert.created_at,
					last_received_time: Date.now()
				};
				alarmService.updateAlarm(oUpdate, (err, oRes) => {
					if (err) {
						winston.error("error while updating halt alarm settings", err.toString());
					}
				});
			}).catch(err => {
					//console.error('findEligibleHalts error',err);
			});
		}
	}

	setDistTodayToZero() {
		this.dist_today = 0;
		if(this.latestLocation && this.latestLocation.dist_today){
            this.latestLocation.dist_today = 0;
		}
	}

	updateDistanceToday() {
        this.getDistanceToday(this.getUID(), (err, dist_today) => {
			if (err) return;
			this.dist_today = dist_today;
            if(this.latestLocation){
                this.latestLocation.dist_today = dist_today;
            }
			const obj = {
				imei: this.getUID(),
				dist_today: dist_today
			};
			dbUtils.update(database.table_device_inventory, obj);
		});
	}

	getDistanceToday(imei, done) {
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
			res = res[imei];

			done(null, res.tot_dist);
		}).catch(function (err) {
			done(err);
		});
	}

	/****************************************
	 SOME SETTERS & GETTERS
	 ****************************************/
	getName() {
		return this.name;
	}

	setName(name) {
		this.name = name;
	}

	getUID() {
		return this.uid;
	}

	setUID(uid) {
		this.uid = uid;
		cassandra.updateStatusReport(uid, true, Date.now());
	}

	updateBooleanReport(type, value, datetime) {
		if (this.booleans === undefined) this.booleans = {};
		let shouldUpdateDb = false;
		let online = false;
		if (this.booleans[type] === undefined || this.booleans[type] === null) {
			online = true;
			shouldUpdateDb = true;
		}
		if (this.booleans[type] !== value) {
			shouldUpdateDb = true;
		}
		this.booleans[type] = value;
		if (!shouldUpdateDb) return;

		let data = {
			imei: this.getUID(),
			datetime: datetime,
			type: type,
			value: value
		};
		if (online) data.online = true;

		dbUtils.update(database.table_report_boolean, data);
	}

	updateBooleanReportsForOffline() {
		if (!this.booleans) return;
		for (const key in this.booleans) {
			dbUtils.update(database.table_report_boolean, {
				imei: this.getUID(),
				datetime: Date.now(),
				type: key,
				value: this.booleans[key],
				offline: true
			});
		}
	}

	updateBooleanReportsForPowerSupply(data) {
		const alarm = {
			imei: data.imei || this.getUID(),
			reg_no: this.reg_no,
			user_id: this.user_id,
			datetime: new Date(),
			model_name: this.model_name
		};
		if(data.power_supply == true){
			alarm.code = 'power_connect';
			alarm.msg = alarms['power_connect']
		}else if(data.power_supply == false){
			alarm.code = 'power_cut';
			alarm.msg = alarms['power_cut'];
		}else{
			console.error('no power supply value');
			return;
		}

		if (this.latestLocation) {
			//TODO fetch location of alarm while it was happened for history packet
			alarm.location = {
				lat: this.latestLocation.lat,
				lng: this.latestLocation.lng,
				datetime: this.latestLocation.datetime,
				address: this.latestLocation.address,
				speed: this.latestLocation.speed,
				course: this.latestLocation.course
			};
		}
		addressService.upsertAlerts(alarm, (err, resp) => {
			if (err) {
				console.error('upsertAlerts error', err);
			}
			let oNotif = {
				"include_external_user_ids": [alarm.user_id],
				"contents": {
					"en": alarm.msg
				},
				"data": {
					reg_no: alarm.reg_no,
					user_id: alarm.user_id,
				},
				"name": alarm.code
			};
			oneSignalNotification.sendOneSignalNotification(oNotif);
		});
	}

	disconnect(msg) {
		// This will emit events error and close in gpsserver, so no need to handle close separately
		this.connection.destroy(new Error(msg));
	}

	getInfo() {
		return this.model_name + '[' + this.getUID() + '] ';
	}
}

module.exports = Device;
