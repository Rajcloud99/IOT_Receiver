
const devices = require('../config').devices;
// const tbs = require('../services/telegramBotService');
const crc16 = require('node-crc-itu');


const path = require('path');

class adapter{

	static get model_name() {
		return path.basename(__filename).split('.')[0];
	}

	constructor(device) {
		this.device = device;
	}

	/*******************************************
	 PARSE THE INCOMING STRING FROM THE DEVICE
	 You must return an object with a least: device_id, cmd and type.
	 return device_id: The device_id
	 return cmd: command from the device.
	 return type: login_request, ping, etc.
	 *******************************************/
	parse_data(data) {
		const dataHex = data.toString('hex');
		const parts = {
			start: dataHex.substr(0, 4),
			length: dataHex.substr(4, 2),
			cmd: dataHex.substr(6, 2),
			data: dataHex.substr(8, dataHex.length - 20),
			serial: dataHex.substr(dataHex.length - 12, 4),
			error: dataHex.substr(dataHex.length - 8, 4),
			stop: dataHex.substr(dataHex.length - 4)
		};

		const error_code = this.get_error_code(parts.length + parts.cmd + parts.data + parts.serial);
		if (error_code !== parts.error) {
			//console.log('data crc check fail for calc error_code ' + error_code + ' and actual ' + parts.error, parts);
			return false;
		}

		switch (parts.cmd) {
			case '01':
				parts.action = "login_request";
				parts.device_id = parseInt(parts.data);
				break;
			//PING -> When the gps sends their position
			case '12':
				parts.action = "ping";
				break;
			case '16':
				parts.action = "alarm";
				break;
			default:
				parts.action = "other";
		}
		// winston.info('crx action: '+parts.action+' from device: '+this.device.getUID());
		// winston.info(JSON.stringify(parts));
		return parts;
	}

	authorize(msg_parts) {
		let msg = '05' + msg_parts.cmd + msg_parts.serial;
		msg += this.get_error_code(msg);
		msg = msg_parts.start + msg + msg_parts.stop;
		this.send_command(msg);
	}

	run_other(cmd, msg_parts) {
		switch (cmd) {
			case "13": //Handshake
				// winston.info('run_other:handshake from device: '+this.device.getUID());
				this.device.receive_handshake(msg_parts);
				this.authorize(msg_parts);
				// winston.info('returning handshake to device: '+this.device.getUID());
				break;
			case '15': // string info
				// winston.info('run_other:string info');
				// winston.info('got string info from device');
				this.device.receive_string_info(msg_parts);
				break;
		}
	}

	request_login_to_device() {
	}

	receive_alarm(msg_parts) {

		this.authorize(msg_parts);

		const str = msg_parts.data;

		const data = {
			date: str.substr(0, 12),
			info_length: parseInt(str.substr(12, 1), 16),
			satellites: parseInt(str.substr(13, 1), 16),
			lat: this.get_coordinate_from_hex(str.substr(14, 8), this.get_course_status(str, 5) === '1' ? 'N' : 'S'),
			lng: this.get_coordinate_from_hex(str.substr(22, 8), this.get_course_status(str, 4) === '1' ? 'W' : 'E'),
			speed: parseInt(str.substr(30, 2), 16),
			real_time: this.get_course_status(str, 2) !== '1',
			course: this.get_course(str),
			mcc: parseInt(str.substr(39, 3), 16),
			mnc: parseInt(str.substr(42, 2), 16),
			lac: str.substr(44, 4),
			cid: str.substr(48, 6),
			oil_power_dc: this.get_terminal_info(str, 7) === '1',
			gps_tracking: this.get_terminal_info(str, 6) === '1',
			alarm_code_phone: this.get_terminal_info(str, 3) + this.get_terminal_info(str, 4) + this.get_terminal_info(str, 5),
			charge_on: this.get_terminal_info(str, 2) === '1',
			acc_high: this.get_terminal_info(str, 1) === '1',
			defense_activated: this.get_terminal_info(str, 0) === '1',
			voltage: parseInt(str.substr(56, 2), 16),
			gsm_signal_str: parseInt(str.substr(58, 2), 16) * 25, // 0 - 4
			alarm_code_terminal: str.substr(60, 2),
			language: str.substr(62, 2),
			device_id: this.device.getUID()
		};
		
		let datetime = "20" + parseInt(data.date.substr(0, 2), 16) +
			"/" + parseInt(data.date.substr(2, 2), 16) +
			"/" + parseInt(data.date.substr(4, 2), 16);
		datetime += " " + parseInt(data.date.substr(6, 2), 16) +
			":" + parseInt(data.date.substr(8, 2), 16) +
			":" + parseInt(data.date.substr(10, 2), 16);
		datetime += ' +0000';
		data.datetime = new Date(datetime).getTime();

		data.alarm_phone = this.get_alarm_phone(data.alarm_code_phone);
		data.alarm_terminal = this.get_alarm_terminal(data.alarm_code_terminal);
		
		this.device.ping(data, true);

		return data.alarm_terminal;
	}

	receive_handshake(msg_parts) {
		const str = msg_parts.data;

		const data = {
			oil_power_dc: this.get_terminal_info_heartbeat(str, 7) === '1',
			gps_tracking: this.get_terminal_info_heartbeat(str, 6) === '1',
			alarm_code_phone: this.get_terminal_info_heartbeat(str, 3) + this.get_terminal_info_heartbeat(str, 4) + this.get_terminal_info_heartbeat(str, 5),
			charge_on: this.get_terminal_info_heartbeat(str, 2) === '1',
			acc_high: this.get_terminal_info_heartbeat(str, 1) === '1',
			defense_activated: this.get_terminal_info_heartbeat(str, 0) === '1',
			voltage: parseInt(str.substr(2, 2), 16),
			gsm_signal_str: parseInt(str.substr(4, 2), 16) * 25,  // 0 - 4
			alarm_code_terminal: str.substr(6, 2),
			language: str.substr(8, 2),
			device_id: this.device.getUID()
		};
		data.datetime = Date.now();
		data.alarm_phone = this.get_alarm_phone(data.alarm_code_phone);
		data.alarm_terminal = this.get_alarm_terminal(data.alarm_code_terminal);

		//this.device.updateBooleanReport('acc', data.acc_high, data.datetime);

		return data;
	}

	receive_string_info(msg_parts) {
		// winston.info(JSON.stringify(msg_parts));
		let data = msg_parts.data;
		const response = {};
		response.status = 'OK';
		response.request = 'commands';
		response.device_id = this.device.getUID();

		for (let i = 0; i < devices.length; i++) {
			if (devices[i].key === this.device.model_name) {
				response.command_type = Object.keys(devices[i].value.sms)[parseInt(data.substr(2, 8))];
				break;
			}
		}

		data = data.substr(10, data.length - 14);
		data = new Buffer(data, 'hex');
		data = data.toString();
		// winston.info(data);
		response.message = data;
		if (response.command_type === 'location') {
			response.data = this.parse_get_location(data);
		}
		return response;
	}

	parse_get_location(data) {
		data = data.split('!');
		if(data[1]){
            data = data[1].substr(1);
		}else{
			data = data[0];
		}
		data = data.split(',');
		const response = {};
		response.device_id = this.device.getUID();
		for (let i in data) {
			const content = data[i].split(':');
			switch (content[0]) {
				case 'Lat':
					response.lat = content[1];
					response.lat = response.lat.charAt(0) === 'N' ? parseFloat(response.lat.substr(1)) : -1 * parseFloat(response.lat.substr(1));
					break;
				case 'Lon':
					response.lng = content[1];
					response.lng = response.lng.charAt(0) === 'E' ? parseFloat(response.lng.substr(1)) : -1 * parseFloat(response.lng.substr(1));
					break;
				case 'Course':
					response.course = parseInt(content[1]);
					break;
				case 'Speed':
					response.speed = parseInt(content[1]);
					break;
				case 'DateTime':
					//response.datetime = new Date(content[1] + ':' + content[2] + ':' + content[3] + ' +0800').getTime();
					let datetime = content[1] + ':' + content[2] + ':' + content[3];
					let cHr = new Date().getHours();
					let UTCHr = new Date(datetime + ' +0000').getHours();
					let ISTHr = new Date(datetime).getHours();
					if(cHr == ISTHr){
						//console.log('crx IST',data.device_id,datetime,new Date(datetime));
					}else if(cHr == UTCHr){
						datetime += ' +0000';//800 to 000
						//console.log('crx UTC',data.device_id,datetime,new Date(datetime));
					}else{//china time
						datetime += ' +0800';
					}
					response.datetime = new Date(datetime).getTime();
					break;
			}
		}
		response.datetime = Date.now();
		return response;
	}

	get_ping_data(msg_parts) {
		const str = msg_parts.data;

		const data = {
			date: str.substr(0, 12),
			info_length: parseInt(str.substr(12, 1), 16),
			satellites: parseInt(str.substr(13, 1), 16),
			lat: this.get_coordinate_from_hex(str.substr(14, 8), this.get_course_status(str, 5) === '1' ? 'N' : 'S'),
			lng: this.get_coordinate_from_hex(str.substr(22, 8), this.get_course_status(str, 4) === '1' ? 'W' : 'E'),
			speed: parseInt(str.substr(30, 2), 16),
			real_time: this.get_course_status(str, 2) !== '1',
			gps_tracking: this.get_course_status(str, 3) === '1',
			course: this.get_course(str),
			mcc: parseInt(str.substr(37, 3), 16),
			mnc: parseInt(str.substr(40, 2), 16),
			lac: str.substr(42, 4),
			cid: str.substr(46, 6),
			device_id: this.device.getUID()
		};

		if (data.length === 60) {
			data.mileage = parseInt(str.substr(52, 8));
		}

		let datetime = "20" + parseInt(data.date.substr(0, 2), 16) +
			"/" + parseInt(data.date.substr(2, 2), 16) +
			"/" + parseInt(data.date.substr(4, 2), 16);
		datetime += " " + parseInt(data.date.substr(6, 2), 16) +
			":" + parseInt(data.date.substr(8, 2), 16) +
			":" + parseInt(data.date.substr(10, 2), 16);

		let cHr = new Date().getHours();
		let UTCHr = new Date(datetime + ' +0000').getHours();
		let ISTHr = new Date(datetime).getHours();
		if(cHr == ISTHr){
			//console.log('crx IST',data.device_id,datetime,new Date(datetime));
		}else if(cHr == UTCHr){
			datetime += ' +0000';//800 to 000
			//console.log('crx UTC',data.device_id,datetime,new Date(datetime));
		}else{//china time
			datetime += ' +0800';
		}	
		

		data.datetime = new Date(datetime).getTime();

		return data;
	}

	getCommandCustom(flag, command) {
		const start = '7878';
		const cmd = '80';
		const serverflagbit = flag;
		const commandcontent = Buffer.from(command).toString('hex');
		// winston.info(commandcontent);
		let lengthofcommand = ((serverflagbit + commandcontent).length / 2).toString(16);
		lengthofcommand = lengthofcommand.length < 2 ? '0' + lengthofcommand : lengthofcommand;
		// winston.info(lengthofcommand);
		const content = lengthofcommand + serverflagbit + commandcontent;
		let length = (parseInt(lengthofcommand, 16) + 6).toString(16);
		length = length.length < 2 ? '0' + length : length;
		const serial = '00A0';
		// winston.info(length, cmd, content, serial);
		const error = this.get_error_code(length + cmd + content + serial);
		const end = '0D0A';
		return start + length + cmd + content + serial + error + end;
	}

	get_location() {
		this.sendCommand('location');
	}

	sendCommand(type, param) {
		let command;
		let num;
		for (let i = 0; i < devices.length; i++) {
			if (devices[i].key === this.device.model_name) {
				command = devices[i].value.sms[type];
				num = Object.keys(devices[i].value.sms).indexOf(type);
				break;
			}
		}
		num = '00000000' + num;
		num = num.substr(num.length - 8);
		if (param) command = command.replace("%20", param);
		this.send_command(this.getCommandCustom(num, command));
	}

    /* INTERNAL FUNCTIONS */

	send_command(msg) {
		// winston.info('sending:'+msg);
		this.device.send(this.format_data(msg));
	}

	format_data(params) {
		return new Buffer(params, 'hex');
	}

	get_error_code(msg) {
		const crc = crc16(msg, 'hex');
		let hexString = crc.toString(16);
		if (hexString.length !== 4) {
			hexString = '0000' + hexString;
			hexString = hexString.substr(hexString.length - 4);
		}
		return hexString;
	}

	get_coordinate_from_hex(coordHex, sign) {
		const deg = parseInt((parseInt(coordHex, 16) / 30000) / 60);
		let min = (parseInt(coordHex, 16) / 30000) % 60;
		min = this.round(min, 4);
		let res = (min / 60) + deg;
		res = this.round(res, 4);
		return (sign.toUpperCase() === "S" || sign.toUpperCase() === "W") ? res * -1 : res;
	}

	round(value, decimals) {
		return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
	}

	get_course_status(str, pos) {
		return this.get_binary_string(str.substr(32, 4)).charAt(pos);
	}

	get_course(str) {
		let course = this.get_binary_string(str.substr(32, 4));
		course = course.substr(6);
		return parseInt(course, 2);
	}

	get_terminal_info(str, pos) {
		return this.get_binary_string(str.substr(54, 2)).charAt(pos);
	}

	get_terminal_info_heartbeat(str, pos) {
		return this.get_binary_string(str.substr(0, 2)).charAt(pos);
	}

	get_binary_string(hexString) {
		let length = hexString.length;
		let binaryString = '';
		length = length / 2;
		for (let i = 0; i < length; i++) {
			const str = '00000000' + parseInt(hexString.substr(i * 2, 2), 16).toString(2);
			binaryString += str.substr(str.length - 8);
		}
		return binaryString;
	}

	get_alarm_phone(alarm_code) {
		let alarm;
		switch (alarm_code) {
			case "000":
				alarm = {
					"code": "normal",
					"msg": "Normal"
				};
				break;
				/*
			case "001":
				alarm = {
					"code": "accident",
					"msg": "The vehicle suffers a sudden jerk or an accident."
				};
				break;
				*/
			case "010":
				alarm = {
					"code": "power_cut",
					"msg": "Power Cut"
				};
				break;
			case "011":
				alarm = {
					"code": "low_battery",
					"msg": "Low Battery"
				};
				break;
			case "100":
				alarm = {
					"code": "sos",
					"msg": "Driver sends a S.O.S."
				};
				break;
			default:
				alarm = {
					"code": "XXX",
					"msg": "Default alarm."
				};
				break;
		}
		return alarm;
	}

	get_alarm_terminal(alarm_code) {
		let alarm;
		switch (alarm_code) {
			case "01":
				alarm = 'sos';
				break;
				/*
			case "02":
				alarm = 'power_cut';
				break;
			case "03":
				alarm = 'accident';
				break;
				*/
			case "04":
				alarm = 'fence_in';
				break;
			case "05":
				alarm = 'fence_out';
				break;
		}
		return alarm;
	}
}

module.exports = adapter;
