/**
 * updated by Kamal on 07-04-2020.
 */
const app = require('express')();
const driver = require('../adapters/driver');
const Device = require('../gpsdevice');
const cassandra = require('../utils/cassandra');
const devices = {};
const winston = require('../utils/logger');
const externalip = require('../config').externalip;
const config = require('../config');

exports.find_device = function (device_id) {
	return devices[device_id];
};

exports.add_device = function (device) {
	devices[device.getUID()] = device;
};

exports.remove_device = function (uid) {
	devices[uid] = null;
	delete devices[uid];
};

exports.getNumOfActiveConnections = function () {
	return Object.keys(devices).length;
};

exports.getNumOfConnections = function() {
	return Object.keys(devices).length;
};

exports.markOfflineIfRequired = function () {
	for (let key in exports.devices) {
		if (!exports.devices[key].connection.connected) devices[key].markAsOffline();
	}
};

exports.disconnectAllDevices = function () {
	for (let key in devices) {
		devices[key].disconnect();
	}
};

exports.forceInsertAllDevices = function (datetime) {
	for (let key in devices) {
		devices[key].forceInsertData(datetime);
	}
};

exports.setAllDistTodayToZero = function () {
	for (let key in devices) {
		devices[key].setDistTodayToZero();
	}
};

exports.sendMessageToDevice = function (message) {
	let device = exports.find_device(message.device_id);
	if (!device) return;
	device.connection.emit('message', JSON.stringify(message));
};

exports.close = function () {
	console.log('application socket conn closed');
	// io.server.close();
};

exports.getLocationOfAllDevices = function () { };

exports.startServerDepr = function () {
	const http = require('http').Server(app);
	const io = require('socket.io')(http);
	io.on('connection', function (socket) {

		winston.info('driver connected: ' + socket.id);
		// telegramBotService.sendMessage('driver connected: ' + socket.id);

		socket.on('device_id', function (device_id) {
			if (socket.device === undefined) {
				socket.device = new Device(driver, socket);
				socket.device.uid = device_id;
				socket.device.lastLocationTime = 0;
				devices[device_id] = socket.device;
			}
		});

		socket.on('data', function (data) {
			// telegramBotService.sendMessage('got data from driver: ' + data);
			data = JSON.parse(data);
			// telegramBotService.sendMessage('sending to driver: ' + JSON.stringify({datetime: data.datetime}));
			socket.emit('data', JSON.stringify({ datetime: data.datetime }));
			data.datetime = new Date(data.datetime).getTime();
			if (socket.device === undefined) {
				socket.device = new Device(driver, socket);
				socket.device.uid = data.device_id;
				socket.device.lastLocationTime = 0;
				devices[data.device_id] = socket.device;
			}
			//After the ping is received, but before the data is saved
			socket.device.ping(data, true);
			cassandra.insertGPSData(JSON.parse(JSON.stringify(data)));
			cassandra.insertServerIpAndStatus(data.device_id, externalip);
		});

		socket.on('disconnect', function () {
			// winston.info('driver' + ' TOTAL CONNECTED DEVICES CONN BEFORE  CLOSE: ' + getNumOfActiveConnections());
			if (!socket.device) return;
			const uid = socket.device.getUID();
			exports.remove_device(uid);
		});

	});
	http.listen(5002, function () {
		winston.info('===========================================================\nListening for Driver App on 5002\n=================================================================');
	});
};
module.exports.startServer = function(){
	if(config && config.wsDriver && config.wsDriver.port){
        const WebSocket2 = require('ws');
		global.wss = new WebSocket2.Server({
			port: config.wsDriver.port,
			perMessageDeflate: config.wsDriver.perMessageDeflate
		});
		wss.on('connection', function connection(ws,req) {
			//check origin before connection
			const ip = req.connection.remoteAddress;
			//when server runs behind a proxy
			const ip2 = req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].split(/\s*,\s*/)[0];
			ws.ip = ip || ip2;
			ws.connectionTime = new Date();
			ws.isAlive = true;
			console.log('new conn',ws.ip);
			ws.on('pong', heartbeat);
			ws.on('message', function incoming(message) {
                let msgD;
                // telegramBotService.sendMessage('got data from driver: ' + data);
				let data = JSON.parse(message);
				if(!data.device_id){
                    let msgD = {'msg':'data does not have device id',datetime: data.datetime};
                    return ws.send(JSON.stringify(msgD));

                }
				// telegramBotService.sendMessage('sending to driver: ' + JSON.stringify({datetime: data.datetime}));
				msgD = {'msg':'data received',datetime: data.datetime};
				ws.send(JSON.stringify(msgD));
				data.datetime = new Date(data.datetime).getTime();
				if (ws.device === undefined || !ws.device_id ) {
					ws.device = new Device(driver, ws);
					ws.device.uid = data.device_id;
					ws.device.lastLocationTime = 0;
					devices[data.device_id] = ws.device;
                    wss.clients.forEach(function each(ws) {
                        if (ws.device_id == data.device_id && ws.authenticated) {
                            console.log('duplicate socket closed',ws.ip,ws.mobile);
                            ws.isAlive = false;
                            ws.close();
                        }
                    });
                    ws.device_id =  data.device_id;
                    this.authenticated = true;
                    this.device_id  = data.device_id;
				}else{
                    console.log(this.device_id,data.device_id);
                }
				//After the ping is received, but before the data is saved
                if(data.location && data.location.length){
                    for(let l=0;l<data.location.length;l++){
                        ws.device.ping(data.location[l], true);
                        //cassandra.insertGPSData(data.location[l]);
                    }
                }else if(data.lat){
					ws.device.ping(data, true);
					//cassandra.insertGPSData(data);
				}
                cassandra.insertServerIpAndStatus(data.device_id,externalip,0,'mobile',data.user_id);

			});
			ws.on('close', () => console.log('Client disconnected',ws.ip,ws.user_id));
			let msg = {'msg':'connected'};
			ws.send(JSON.stringify(msg));
		});

		const interval = setInterval(function ping() {
			wss.clients.forEach(function each(ws) {
				console.log('socket ',ws.ip,ws.mobile);
				if (ws.isAlive === false) {
					console.log('socket closed',ws.ip,ws.mobile);
					return ws.close();
				}
				let msg2 = {"msg":"heartbeat"};
				ws.send(JSON.stringify(msg2));
			});
		}, 30000);
	}else{
		console.error('socket configs are not found');
	}
};
function heartbeat() {
	this.isAlive = true;
}

function getWebSocketForUser(mobile){
	if(!wss){
		console.log('web socket server not created');
		return false;
	}else {
		wss.clients.forEach(function each(ws) {
			if (ws.mobile == mobile && ws.authenticated) {
				return ws;
			}
		});
		return false;
	}
};
