/**
 * Created by Bharath on 20-12-2016.
 */

const socketServer = require('../servers/socketserver');
const devices = require('../config').devices;
const tbs = require('../services/telegramBotService');
const winston = require('../utils/logger');
const fs = require('fs');

//added for demo purpose only , remove demo. after it
//const demo = require('../tests/tk103Demo');

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
        data = data.toString();
        //018929985371BP04180830V0000.0000N00000.0000E000.0074601000.00000004A9L00000000
        //018929985371BR00180830V0000.0000N00000.0000E000.0074627000.00000004A9L00000000
        if(this.device.getUID() == 10000005468) {
            //fs.appendFile('tk103-10000005468.txt', new Date() + ' : ' + data + '\n', function (err) {});
        }
        const parts = {};
        parts.start = data[0];
        parts.time = data.substr(1, 12);
        parts.cmd = data.substr(13, 4);
        parts.data = data.substring(17, data.length - 1);
        parts.end = data[data.length - 1];
        parts.original = data;

        switch (parts.cmd) {
            case 'BP05':
                parts.action = "login_request";
                parts.device_id = parseInt(parts.data.substr(0, 15));
                break;
            //PING -> When the gps sends their position
            case 'BR00':
                parts.action = "ping";
                if(!this.device.getUID()){
                    parts.device_id = parseInt(data.substr(1, 12));
                    //console.log('on tk103 ping',parts.device_id);
                    //this.device.setUID(parts.device_id);
                    //this.device.login_request(parts);
                }
                break;
            case 'BO01':
                parts.action = "alarm";
                break;
            default:
                parts.action = "other";
        }

        if(this.device.getUID() == this.device.logOne) {
            let fName ='tk103-'+ this.device.logOne;
            fs.appendFile(fName, parts.cmd +"  "+ new Date() + ' : ' + data + '\n', function (err) {});
            console.log(parts.device_id,this.device.getUID(),this.device.connection.c_id);
        }
        return parts;
    }

    authorize(msg_parts) {
        // var msg = msg_parts.device_id.substr(-12) + 'AP05';
        const msg = this.getUID() + 'AP05';
        // winston.info('authorize', msg);
        this.send_command(this.getCommandCustom(msg));

        // This device sends location data as well on login, which can be captured here
        msg_parts.data = msg_parts.data.substr(15);
        //this.device.ping(msg_parts, false);
    }

    answer_alarm(alarm_type) {
        // var msg = ('0' + this.device.getUID()).substr(-12) + 'AS01' + alarm_type;
        const msg = this.getUID() + 'AS01' + alarm_type;
        // winston.info(msg);
        this.send_command(this.getCommandCustom(msg));
    }

    run_other(cmd, msg_parts) {
        switch (cmd) {
            case "BR05": //Handshake
            case "BR06": //Handshake
            case "BP00":
                // winston.info('run_other:handshake from device: '+this.device.getUID());
                this.device.receive_handshake(msg_parts);
                // winston.info('returning handshake to device: '+this.device.getUID());
                break;
            default: // string info
                // winston.info('run_other:string info');
                // winston.info('got string info from device');
                this.device.receive_string_info(msg_parts);
                break;
        }
    }

    request_login_to_device(msg_parts) {
        this.device.login_request(msg_parts);
    }

    receive_alarm(msg_parts) {
        
        const str = msg_parts.data;
        const data = {};
        const alarm_code = str[0];
        
       // fs.appendFile('tk103-alarms.txt', new Date() + ' : ' + str + '\n', function (err) {});
      
        data.location = this.get_ping_data({data: str.substr(1)});

        //this.device.ping(data.location, true);

        this.answer_alarm(alarm_code);
       
        data.alarm_terminal = this.get_alarm_terminal(alarm_code);

        //this.device.receive_alarm(data.alarm_terminal, true);

        return data;
    }

    get_alarm_terminal(alarm_code) {
        let alarm;
        switch (alarm_code) {
            case "0":
                alarm = 'power_cut';
                break;
            case "1":
                alarm = 'sos';
                break;
            case "2":
                //alarm = 'sos'; TODO check issue why sos coming 
                alarm = 'NO Alarm';
                break;
            case "3":
                alarm = 'anti_theft';
                break;
            case "4":
                alarm = 'under_speed';
                break;
            case "5":
                alarm = 'over_speed';
                break;
            case "6":
                alarm = 'fence_out';
                break;
        }
        return alarm;
    }

    receive_handshake(msg_parts) {
        const acc = {};
        acc.device_id = this.device.getUID();
        acc.datetime = Date.now();
        switch (msg_parts.cmd) {
            case 'BR05':
                acc.acc_high = true;
                break;
            case 'BR06':
                acc.acc_high = false;
                break;
        }
		//this.device.updateBooleanReport('acc', acc.acc_high, acc.datetime);
        return acc;
    }

    receive_string_info(msg_parts) {
        // winston.info('tk103 string info', JSON.stringify(msg_parts));

        const response = {};
        response.status = 'OK';
        response.request = 'commands';
        response.device_id = this.device.getUID();

        for (let i = 0; i < devices.length; i++) {
            if (devices[i].key === this.device.model_name) {
                for (let key in devices[i].value.sms) {
                    if (devices[i].value.sms[key].code === msg_parts.cmd) {
                        response.command_type = key;
                        break;
                    }
                }
                break;
            }
        }
        if (response.command_type === 'location') response.data = this.get_ping_data(msg_parts);
        response.message = msg_parts.data;
        // winston.info('sim', JSON.stringify(response));
        return response;
    }

    parse_get_location(data) {
        return this.get_ping_data({data: data});
    }

    get_ping_data(msg_parts) {
        const str = msg_parts.data;
        //010000000707
        //BR00 cmd
        //210102 //YYMMDD
        //V invalidation and A availability
        //2836.2709 lat
        //N
        //07639.8392 lng
        //E
        //000.0 speed
        //000632 HHMMSS
        //4.6900 orientation
        //01000007 io state
        //L mileage
        //04E20C13  milege data
        const data = {
            date: str.substr(0, 6) + str.substr(33, 6), //
            gps_tracking: str.substr(6, 1) === 'A',
            lat: parseInt(str.substr(7, 2)) + parseFloat(str.substr(9, 7)) / 60,
            ns: str.substr(16, 1),
            lng: parseInt(str.substr(17, 3)) + parseFloat(str.substr(20, 7)) / 60,
            ew: str.substr(27, 1),
            speed: parseInt(str.substr(28, 5)),
            course: parseInt(str.substr(39, 6)),
            io_state: str.substr(45, 8),
            mileage: str.substr(53, 1),
            distance: parseInt(str.substr(54, 8), 16),
            device_id: this.device.getUID()
        };

        data.original = msg_parts.original;

        data.lat = data.ns === 'N' ? data.lat : -1 * data.lat;
        data.lng = data.ew === 'E' ? data.lng : -1 * data.lng;

        let year = "20" + parseInt(data.date.substr(0, 2));
        let month = parseInt(data.date.substr(2, 2));
        if(month.toString() && month.toString().length === 1){
            month= "0"+month.toString();
        }
        let day = parseInt(data.date.substr(4, 2));
        if(day.toString() && day.toString().length === 1){
            day= "0"+day.toString();
        }
        let hr = parseInt(data.date.substr(6, 2));
        if(hr.toString() && hr.toString().length === 1){
            hr= "0"+hr.toString();
        }
        let min = parseInt(data.date.substr(8, 2));
        if(min.toString() && min.toString().length === 1){
            min= "0"+min.toString();
        }
        let sec = parseInt(data.date.substr(10, 2));
        if(sec.toString() && sec.toString().length === 1){
            sec= "0"+sec.toString();
        }
        let datetime = year + "-" + month + "-" + day + "T" +hr+":"+min+":"+sec+".000Z";
        //console.log(data.device_id,datetime,data.original);
        //console.log(str);
        data.datetime = new Date(datetime).getTime();
        data.power_on = data.io_state[0] == 0;
        data.acc_high = data.io_state[1] == 1;

        let binaryString = parseInt(data.io_state[2], 16).toString(2);
        binaryString = ('0000' + binaryString).substr(-4);
        data.oil_supply = binaryString[0] == 0;
        data.power_supply = binaryString[1] == 0;
        data.sos_pressed = binaryString[2] == 1;
        data.orange_wire_input = binaryString[3] == 1;
        data.voltage = parseInt(data.io_state.substr(5), 16) / 100;
        data.ac_on = data.orange_wire_input;
        //this.device.updateBooleanReport('ac', data.ac_on, data.datetime);
		//this.device.updateBooleanReport('acc', data.acc_high, data.datetime);

        return data;
    }

    getCommandCustom(command) {
        const start = '(';
        const end = ')';
        return start + command + end;
    }

    get_location() {
        this.sendCommand('location');
    }

    sendCommandVold(type, param) {
        // winston.info('in sendCommand', type, param);
        let command;
        for (let i = 0; i < devices.length; i++) {
            if (devices[i].key === this.device.model_name) {
                command = devices[i].value.sms[type].sms;
                break;
            }
        }


        if(param == 0 || param == 1){
            command = command+param;
        }
        command = ('0' + this.device.getUID()).substr(-12) + command;
        if(this.getUID() == 10000005468){
            console.log('tk103 command ',command);
        }

        this.send_command(this.getCommandCustom(command));
    }

    sendCommand(type, param) {
        // winston.info('in sendCommand', type, param);
        let command;
        for (let i = 0; i < devices.length; i++) {
            if (devices[i].key === this.device.model_name) {
                command = devices[i].value.sms[type].sms;
                break;
            }
        }
        let logCmd = false;
        if(command == 'AV01%20'){
            logCmd = true;
        }
        if(param == 0 || param == 1){
            command = command.replace("%20", param);
        }
        command = ('0' + this.device.getUID()).substr(-12) + command;
        if(logCmd){
            console.log('tk103 command ',command);
        }

        this.send_command(this.getCommandCustom(command));
    }

    /* INTERNAL FUNCTIONS */

    send_command(msg) {
        //console.log('sending tk103 command:', msg);
        this.device.send(this.format_data(msg));
    }

    format_data(params) {
        return new Buffer(params);
    }

    getUID() {
        return ('0000' + this.device.getUID()).substr(-12);
    }

}
module.exports = adapter;
