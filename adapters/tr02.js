const socketServer = require('../servers/socketserver');
const devices = require('../config').devices;
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
		// fs.appendFile('tr02.txt', new Date() + ' : '+ dataHex+'\n', function (err) {});
		// telegramBotService.sendMessage(new Date() + ' : '+ dataHex);

		const parts = {
			start: dataHex.substr(0, 4),
			length: dataHex.substr(4, 2),
			info: dataHex.substr(6, 4),
			device_id: parseInt(dataHex.substr(10, 16)),
			serial: dataHex.substr(26, 4),
			cmd: dataHex.substr(30, 2),
			data: dataHex.substr(32, dataHex.length - 4),
			stop: dataHex.substr(dataHex.length - 4)
		};

		if (parts.start === '7878') {
			return false;
		}
		//telegramBotService.sendMessage(parts.cmd + " "+ parts.device_id + " " + parts.data);
		switch (parts.cmd) {
			//PING -> When the gps sends their position
			case '10':
				parts.action = "ping";
				break;
			default:
				parts.action = "other";
		}
		//winston.info('action: ' + parts.cmd + ' from device: ' + parts.device_id + ' dataHex' + dataHex);
		return parts;
	}

	authorize(msg_parts) {
	}

	return_handshake() {
		this.send_command('54681A0D0A');
	}

	run_other(cmd, msg_parts) {
		// winston.info('cmd:' + cmd + 'device_id' + msg_parts.device_id);
		//winston.info('MSG:' + JSON.stringify(msg_parts));
		switch (cmd) {
			case "1a": //Handshake
				// winston.info('run_other:handshake from device: ' + this.device.getUID());
				this.device.receive_handshake(msg_parts);
				this.return_handshake();
				// winston.info('returning handshake to device: ' + this.device.getUID());
				break;
			case "1c": //location
			case "1C":
				// winston.info('run_other:location from device: ' + this.device.getUID());
				this.device.receive_string_info(msg_parts);
				break;
		}
	}

	request_login_to_device(msg_parts) {
		this.device.login_request(msg_parts);
	}

	receive_handshake(msg_parts) {
		const str = msg_parts.data;

		const data = {
			positioning_state: str.substr(0, 4),
			satellites: parseInt(str.substr(4, 2), 16),
			satellites_snr: str.substr(6),
			voltage: parseInt(msg_parts.info.substr(0, 2), 16),
			gsm_signal_str: parseInt(msg_parts.info.substr(2, 2), 16) * 25, // 0 - 4
			device_id: this.device.getUID()
		};
		data.datetime = Date.now();
		//winston.info('handshake: ' + data.device_id + ' : ' + JSON.stringify(data));
		return data;
	}

	receive_string_info(msg_parts) {
		msg_parts.datetime = Date.now();
		const response = {};
		response.status = 'OK';
		response.request = 'commands';
		response.device_id = this.device.getUID();
		response.command_type = 'location';
		response.data = msg_parts;
		response.message = JSON.stringify(msg_parts);
		return response;
	}

	get_ping_data(msg_parts) {
		const str = msg_parts.data;

		const data = {
			date: str.substr(0, 12),
			lat: this.get_coordinate_from_hex(str.substr(12, 8), this.get_course_status(str, 6) === '1' ? 'N' : 'S'),
			lng: this.get_coordinate_from_hex(str.substr(20, 8), this.get_course_status(str, 5) === '1' ? 'E' : 'W'),
			speed: parseInt(str.substr(28, 2), 16),
			gps_tracking: this.get_course_status(str, 7) === '1',
			course: this.get_course(str),
			mnc: parseInt(str.substr(34, 2), 16),
			lac: msg_parts.info,
			cid: str.substr(46, 4),
			device_id: this.device.getUID()
		};

		let datetime = "20" + parseInt(data.date.substr(0, 2), 16) +
			"/" + parseInt(data.date.substr(2, 2), 16) +
			"/" + parseInt(data.date.substr(4, 2), 16);
		datetime += " " + parseInt(data.date.substr(6, 2), 16) +
			":" + parseInt(data.date.substr(8, 2), 16) +
			":" + parseInt(data.date.substr(10, 2), 16);
		datetime += ' +0800';
		// data.datetime = new Date(datetime).getTime();
		data.datetime = Date.now();
		// winston.info('location: ' + data.device_id + ' : ' + JSON.stringify(data));
		//telegramBotService.sendMessage(new Date() + ' : '+ JSON.stringify(data));
		return data;
	}

	getCommandCustom(flag, command) {
		const start = '8888';
		const cmd = '1C';
		const serverflagbit = flag;
		const commandcontent = Buffer.from("WHERE,666666#").toString('hex');
		//var commandcontent = "87726982694454545454545435"; //ASCII
		//var commandcontent = "57484552452C36363636363623"; //hex
		// winston.info(commandcontent);
		//var lengthofcommand = ((serverflagbit + commandcontent).length / 2).toString(16);
		//lengthofcommand = lengthofcommand.length < 2 ? '0' + lengthofcommand : lengthofcommand;
		// winston.info(lengthofcommand);
		const lengthofcommand = (serverflagbit + commandcontent).length / 2;
		let length = lengthofcommand + 1 + 1;
		// console.log("l1", length);
		const content = lengthofcommand.toString(16) + serverflagbit + commandcontent;
		//var length = (parseInt(lengthofcommand, 16) + 6).toString(16);
		length = length.toString(16);
		//length = length.length < 2 ? '0' + length : length;
		// console.log("l2", length);
		const serial = '00A0';
		// winston.info(length, cmd, content, serial);
		//var error = this.get_error_code(length + cmd + content + serial);
		const end = '0D0A';
		// console.log("start " + start + " length " + length + " lengthofcommand " + lengthofcommand + " serverflagbit " + serverflagbit + " cmd " + cmd + " content " + content + " end " + end);
		//telegramBotService.sendMessage("start " + start + " length " +length + " cmd " +cmd + " content " +content + " end " + end);
		//return start + length + cmd + content + serial + error + end;
		return start + length + cmd + content + end;
	}

	get_location() {
		if (!this.device.latestLocation) return;
		this.device.receive_string_info(JSON.parse(JSON.stringify(this.device.latestLocation)));
	}

	/*
	 get_location() {
	 this.sendCommand('location');
	 };
	 */
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
		// winston.info('sending:' + msg);
		this.device.send(this.format_data(msg)
		);
	}

	format_data(params) {
		return new Buffer(
			params, 'hex');
	}

	get_error_code(msg) {
		const crc = crc16(msg, 'hex');
		let hexString = crc.toString(16);
		if (hexString.length !== 4) {
			hexString = '0000' + hexString;
			hexString =
				hexString.substr(
					hexString.length - 4);
		}
		return hexString;
	}

	get_coordinate_from_hex(coordHex, sign) {
		const deg = parseInt((parseInt(coordHex, 16) / 30000) /
			60);
		let min = (
				parseInt(coordHex, 16) / 30000
			) % 60;
		min =
			this.round(min, 4);
		let res = (min / 60) + deg;
		res = this.round(
			res,

			4);
		return (sign.toUpperCase() === "S" ||
		sign.toUpperCase() === "W") ? res * -1 : res;
	}

	round(value, decimals) {
		return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
	}

	get_course_status(str, pos) {
		return this.get_binary_string(str.substr(46, 2)).charAt
		(pos);
	}

	get_course(str) {
		let course = this.get_binary_string(str.substr
		(30, 4));
		course =
			course.substr(6);
		return parseInt(course, 2);
	}

	get_binary_string(hexString) {
		let length = hexString.length;
		let binaryString =
			'';
		length = length / 2;
		for (let i = 0; i < length; i++) {
			const str = '00000000' + parseInt(hexString.substr(i * 2, 2), 16).toString(2);
			binaryString += str.substr(str.length - 8);
		}
		return binaryString;
	}

}

module.exports = adapter;
