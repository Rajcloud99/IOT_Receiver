const net = require('net');
const extend = require('node.extend');
const Device = require('../gpsdevice');
const winston = require('../utils/logger');

class Server {

	constructor(opts) {
		const defaults = {
			debug: false,
			port: 3000,
			device_adapter: false
		};

		//Merge default options with user options
		this.opts = extend(defaults, opts);

		this.devices = {};

		this.server = false;
		this.availableAdapters = {
			TK103: './adapters/tk103'
		};

		this.init();

	}

	/****************************
	 SOME FUNCTIONS
	 *****************************/
	/* */
	setAdapter(adapter) {
		this.device_adapter = adapter;
	}

	getAdapter() {
		return this.device_adapter;
	}

	addAdaptar(model, Obj) {
		this.availableAdapters.push(model);
	}

	init() {

		/*****************************
		 DEVICE ADAPTER INITIALIZATION
		 ******************************/
		if (this.opts.device_adapter === false)
			throw 'The app don\'t set the device_adapter to use. Which model is sending data to this server?';

		this.setAdapter(require(this.opts.device_adapter));


		/* FINAL INIT MESSAGE */
		winston.info('===========================================================\nGPS Gaadi GPS Receiver running at port ' + this.opts.port + ' for device: ' + this.getAdapter().model_name);

		/*************************************
		 AFTER INITIALIZING THE APP...
		 *************************************/
		this.server = net.createServer(connection => {
			//Now we are listening!

			connection.setKeepAlive(true, 1000);
			connection.setTimeout(20 * 60 * 1000);
			connection.id = Math.floor(Math.random() * 1000);

			const device = new Device(this.getAdapter(), connection);

		}).listen(this.opts.port);
		this.server.on('error', err => {
			console.log('server error '+ err);
			// winston.info('server error:' + err);
		});

	}

	/* Search a device by ID */
	find_device(device_id) {
		return this.devices[device_id];
	}

	add_device(device) {
        this.devices[device.getUID()] = device;
	}

	remove_device(uid) {
		delete this.devices[uid];
	}

	getNumOfActiveConnections() {
		let num = 0;
		for (const key in this.devices) {
			if (!this.devices[key].connection.destroyed) num++;
		}
		return num;
	}

    getActiveConnections(device_id) {
		if(this.devices[device_id]){
			return this.devices[device_id];
		}else{
            return 'no connection';
		}
    }

	markOfflineIfRequired() {
		for (const key in this.devices) {
			if (this.devices[key].connection.destroyed) this.devices[key].markAsOffline();
		}
	}

	printAllConnectedDevices() {
		for (const key in this.devices) {
			if (!this.devices[key].connection.destroyed) winston.info(key);
		}
	}

	getLocationOfAllDevices() {
		for (let key in this.devices) {
			this.devices[key].fetchLocation('gpsserver');
		}
	}

	disconnectAllDevices() {
		for (let key in this.devices) {
			this.devices[key].disconnect('disconnectAllDevices');
		}
	}

	close() {
		this.server.close();
	}

	forceInsertAllDevices(datetime) {
		for (let key in this.devices) {
			this.devices[key].forceInsertData(datetime);
		}
	}

	setAllDistTodayToZero() {
		for (let key in this.devices) {
			this.devices[key].setDistTodayToZero();
		}
	}

	/* SEND A MESSAGE TO DEVICE ID X */
	send_to(device_id, msg) {
		const dev = this.find_device(device_id);
		dev.send(msg);
	}

	getLatestDataAllConnectedDevices(oFilter,devsResp) {
		for (const key in this.devices) {
			let oDev = this.devices[key];
			let syncUser = false;
			let vehicle_number = false;
			for(let g=0;g<(oDev.aGpsgaadi && oDev.aGpsgaadi.length);g++){
				if(oDev.aGpsgaadi[g].user_id == oFilter.user_id){
					syncUser = true;
					vehicle_number = oDev.aGpsgaadi[g].reg_no;
				}
			}
			if (oDev.latestLocation){
				let oLoc = oDev.latestLocation;
				if(syncUser && oLoc && vehicle_number && oLoc.lat) {	
					devsResp.push({
						device_id:oLoc.device_id,
						epoch:new Date(oLoc.datetime).getTime(),
						server_timestamp: Date.now(),
						vendor_device_id : vehicle_number,
						vehicle_number : vehicle_number,
						vendor_device_details:'UPS199',
						lat: oLoc.lat,
						lon: oLoc.lng,
						spd: oLoc.speed,
						gps_status:"valid",
						gps_packet_type:"current",
						ignition:oLoc.power_on || oLoc.acc_high || false   
					});
				}
			}else{
				//winston.info('NO getLatestDataAllConnectedDevices',key);		
			} 
		}
		console.log('getLatestDataAllConnectedDevices for MMP count', devsResp.length);
		return devsResp;
	}

}

module.exports = Server;
