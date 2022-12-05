/**
 * Updated by Kamal on 09-08-2018.
 */

const net = require('net');
const split = require('split');
const winston = require('../utils/logger');
const telegramBotService = require('../services/telegramBotService');
const sockets = {};
const port = 5000;
const servers = require('./servers');

const feedtype = {
    live_feed: 'lf',
    live_feedV2: 'lf2',
    stop_feed: 'sf',
    alerts: 'a',
    commands: 'c',
    stop_all: 'sa',
	sendToDriver: 'sd',
	heartbeat: 'h',
	server_ip: 'ip',
	update_alarm: 'ua',
	update_trip: 'ut'
};

let deviceOfflineResponseForCommands = {
    status: 'ERROR',
    message: 'device offline',
    request: 'commands',
};

const server = net.createServer(function(socket){
    // winston.info('addresses', socket.localAddress, socket.remoteAddress);
	if(!socket.remoteAddress) {
		telegramBotService.sendAlert('no remoteAddress');
		return;
	}
	let ip = socket.remoteAddress.split(':');
	ip = ip[ip.length-1];
    sockets[ip] = socket;
	socket.id = Math.floor(Math.random() * 1000);
	socket.ip = ip;
	// winston.info('socket server connected: ' + socket.id);
	telegramBotService.sendMessage('socket server connected: ' + socket.id,ip);

	socket.setKeepAlive(true, 1000);

	socket.feedRequestsForDevice = {};
    socket.feedRequestsForDeviceV2 = {};
	socket.alertRequestsForDevice = {};

	const stream = socket.pipe(split());
	stream.on('data', function(data) {
		// winston.info(data);
		try{
			data = JSON.parse(data);
			handleData(data, socket);
		} catch(err) {}
	});

	socket.on('end', function() {
		// This will emit events error and close, so no need to handle close separately
		socket.destroy('device side end');
	});

	socket.on('error', function(err) {
		// winston.error('ss err', err);
		// do nothing
	});

	socket.setTimeout(6 * 60 * 1000, function() {
		// This will emit events error and close, so no need to handle close separately
		socket.destroy('timeout');
	});

}).listen(port);

// close will be immediately followed
server.on('error', function(err){
	// winston.error('socket server error', err);
	telegramBotService.sendMessage('socket server error');
});

server.on('close', function(err){
	// winston.error('socket server close/', err);
	telegramBotService.sendMessage('socket server close');
});

function handleData(data, socket){
	switch(data.ft){
		// case feedtype.server_ip:
		// 	sockets[data.ip] = socket;
		// break;
		case feedtype.live_feed:
			if (!servers[data.t]) return;
			socket.feedRequestsForDevice[data.d] = true;
			break;
        case feedtype.live_feedV2:
        	//console.log('live_feedV2',data.d);
            if (!servers[data.t]) return;
            socket.feedRequestsForDeviceV2[data.d] = true;
		break;
		case feedtype.alerts:
			if (!servers[data.t]) return;
		    socket.alertRequestsForDevice[data.d] = true;
		break;
		case feedtype.commands:
			console.log('command ',data);
			const s1 = servers[data.t];
            // winston.info('connected', s1.getNumOfActiveConnections());
            // s1.printAllConnectedDevices();
	        const device = s1 ? s1.find_device(data.d) : null;
			// winston.info('device: '+JSON.stringify(device));
	        if (!device) {
	        	console.log('device not foind for command to dispatch');
                // winston.info('device not found');
	            deviceOfflineResponseForCommands.command_type = data.c;
				deviceOfflineResponseForCommands.device_id = data.d;
				sendMessage(socket, 'message', deviceOfflineResponseForCommands);
				// winston.info('sending device offline response: '+ JSON.stringify(deviceOfflineResponseForCommands));
	        } else {
                // winston.info('device found');
	            device.adapter.sendCommand(data.c, data.p);
	        }
		break;
		case feedtype.sendToDriver:
			// winston.info('got driver message from socket:', data);
			const d = data.t;
			const s2 = servers.driver;
			s2.sendMessageToDevice(d);
		break;
		case feedtype.heartbeat:
			// winston.info('got hb ', data.id);
            sendMessage(socket, 'heartbeat', data.id);
		break;
		case feedtype.update_alarm:
			if(!servers[data.t]) return;
			if(!servers[data.t].find_device(data.d)) return;
			servers[data.t].find_device(data.d).getAlarms();
			break;
		case feedtype.update_trip:
			if(!servers[data.t]) return;
			if(!servers[data.t].find_device(data.d)) return;
			servers[data.t].find_device(data.d).getTripAlarms();
	}
}

function sendMessage(socket, type, message){
	if (socket.destroyed) {
		//console.log('socket already destroyed' , socket.id);
		return;
	}
	message = {type: type, msg: message};
  	socket.write(Buffer.from(JSON.stringify(message)+'\n'));
}

exports.deviceConnected = function(device_id) {
    for (let key in sockets) {
		sendMessage(sockets[key], 'device_connected', device_id);
    }
};

exports.deviceDisconnected = function(device_id) {
    for (let key in sockets) {
		sendMessage(sockets[key], 'device_disconnected', device_id);
        sockets[key].feedRequestsForDevice[device_id] = null;
        delete sockets[key].feedRequestsForDevice[device_id];
        sockets[key].feedRequestsForDeviceV2[device_id] = null;
        delete sockets[key].feedRequestsForDeviceV2[device_id];
    }
};

exports.sendPingToAllSockets = function(data, acc_high, callback) {
    // winston.info('in sendPing');
    let response = {};
    response.status = 'OK';
    response.request = 'live_feed';
    response.message = 'live feed';
    data.time = data.datetime;
    data.status = 'online';
    data.acc_high = acc_high;
    response.data = data;
    // winston.info(data.device_id);
    for (let key in sockets) {
        if (sockets[key].feedRequestsForDevice[data.device_id]) {
            // winston.info('sending ping:'+JSON.stringify(response));
			sendMessage(sockets[key], 'message', response);
        }
        if (sockets[key].feedRequestsForDeviceV2[data.device_id]) {
            response.request = 'live_feedV2';
            response.message = 'live feedV2';
            //console.log(data.device_id, 'live_feedV2');
            sendMessage(sockets[key], 'message', response);
        }
    }
	if(callback) callback();
};

exports.sendAlertToAllSockets = function(data, device_id) {
    // winston.info('in sendPing');
    let response = {};
    response.status = 'OK';
    response.device_id = device_id;
    response.message = 'alerts';
    response.request = 'alerts';
    data.time = data.datetime;
    response.data = data;
    // winston.info(data.device_id);
    for (let key in sockets) {
        // if (sockets[key].alertRequestsForDevice[data.device_id]) {
		sendMessage(sockets[key], 'message', response);
        // }
    }
};

exports.sendCommandToAllSockets = function(response, device) {
	// winston.info('sendCommandToAllSockets: '+JSON.stringify(response));
    for (let key in sockets) {
		sendMessage(sockets[key], 'message', response);
    }
};

exports.disconnect = function() {
    for (let key in sockets) {
        sockets[key].end();
    }
};

exports.close = function(){

};

winston.info('===========================================================\nListening for Socket Server on 5000\n=================================================================');
