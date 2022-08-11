/**
 * Created by kamal on 06-12-2017.
 */

const socketServer = require('../servers/socketserver');
const devices = require('../config').devices;
const tbs = require('../services/telegramBotService');
const converter = require('../utils/converter');

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
        data = converter.byteArrayToHexString(data);
        const parts = {};
        parts.start = data.substr(0,4);
        if(parts.start=='000f'){
            parts.cmd = '01';
            parts.device_id = converter.hex2bin(data.substr(4,data.length-1));
            console.log('login',parts.device_id);
        }else{
            parts.cmd='02';
            parts.action='ping';
            parts.crc = data.substr(data.length-8,8);
            parts.dataWithChecks = data.substr(16, data.length-8);
            parts.codecId = parts.dataWithChecks.substr(0,2);
            parts.numberOfData = parts.dataWithChecks.substr(2,2);
            parts.data = parts.dataWithChecks.substr(4,parts.dataWithChecks.length-2);
            parts.device_id = this.device.getUID();
        }

        switch (parts.cmd) {
            case '01':
                parts.action = "login_request";
                break;
            case '02':
                parts.action = "ping";
                break;
            case '03':
                parts.action = "alarm";
                break;
            default:
                parts.action = "other";
        }
        // winston.info('action: '+parts.action+' from device: '+this.device.getUID());

        return parts;
    }

    authorize(msg_parts) {
        const msg = '01';
        this.send_command(this.getCommandCustom(msg));

        // This device sends location data as well on login, which can be captured here
        //msg_parts.data = msg_parts.data.substr(15);
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

    request_login_to_device() {
    }

    receive_alarm(msg_parts) {

        const str = msg_parts.data;
        const data = {};
        const alarm_code = str[0];
        data.location = this.get_ping_data({data: str.substr(1)});

        this.device.ping(data.location, true);

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
                alarm = 'sos';
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
       // this.device.updateBooleanReport('acc', acc.acc_high, acc.datetime);
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
        //let msg = msg_parts.codecId +  msg_parts.numberOfData;
        let msg =  msg_parts.numberOfData;
        this.send_command(this.getCommandCustom(msg));
        console.log('ping',new Date(),msg,this.device.getUID());
        const data = {};
        let datetime = str.substr(0,16);
        datetime = parseInt(datetime,16);
        data.date = new Date(datetime).getTime();
        data.datetime = data.date;
        data.device_id = this.device.getUID() || this.device.uid;
        data.priority = str.substr(16,2);
        let lng = str.substr(18,8);
        lng = parseInt(lng,16)/10000000;
        data.lng = lng;

        let lat = str.substr(26,8);
        lat = parseInt(lat,16)/10000000;
        data.lat = lat;

        let alt = str.substr(34,4);
        data.altitude = parseInt(alt,16);

        let ang = str.substr(38,4);
        data.course = parseInt(ang,16);

        let sat = str.substr(42,2);
        data.satellites = parseInt(sat,16);

        let spd = str.substr(44,4);
        data.speed = parseInt(spd,16);

        data.hasGpsFix = !(((data.angle === data.speed) === data.satellites) && (data.satellites == 0));
        /*
        // Validating number of data;
        if (substr($avlDataWithChecks, 2, 2) !== substr($avlDataWithChecks, strlen($avlDataWithChecks) - 2, 2)) {
            throw new ParserException("First element count check is different than last element count check");
        }
        date: str.substr(0, 6) + str.substr(33, 6),
            gps_tracking: str.substr(6, 1) === 'A',
            lat: parseInt(str.substr(7, 2)) + parseFloat(str.substr(9, 9)) / 60,
            ns: str.substr(16, 1),
            lng: parseInt(str.substr(17, 3)) + parseFloat(str.substr(20, 7)) / 60,
            ew: str.substr(27, 1),
            speed: parseInt(str.substr(28, 5)),
            course: parseInt(str.substr(39, 6)),
            io_state: str.substr(45, 8),
            mileage: str.substr(53, 1),
            distance: parseInt(str.substr(54, 8), 16),
            device_id: this.device.getUID()

        data.original = msg_parts.original;
        data.power_on = data.io_state[0] === 0;
        data.acc_high = data.io_state[1] === 1;

        let binaryString = parseInt(data.io_state[2], 16).toString(2);
        binaryString = ('0000' + binaryString).substr(-4);
        data.oil_supply = binaryString[0] === 0;
        data.power_supply = binaryString[1] === 0;
        data.sos_pressed = binaryString[2] === 1;
        data.orange_wire_input = binaryString[3] === 1;
        data.voltage = parseInt(data.io_state.substr(5), 16) / 100;
        data.ac_on = data.orange_wire_input;

        this.device.updateBooleanReport('ac', data.ac_on, data.datetime);
        this.device.updateBooleanReport('acc', data.acc_high, data.datetime);
        */

        return data;
    }
    get_data(data){

    }

    getCommandCustom(command) {
        const start = '(';
        const end = ')';
        //return start + command + end;
        return command;
    }

    get_location() {
        //this.sendCommand('location');
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
        if (param) command = command.replace("%20", param);
        // command = ('0' + this.device.getUID()).substr(-12) + command;
        command = this.getUID() + command;

        // winston.info('sending command', this.getCommandCustom(command));
        this.send_command(this.getCommandCustom(command));
    }

    /* INTERNAL FUNCTIONS */

    send_command(msg) {
        this.device.send(this.format_data(msg));
    }

    format_data(params) {
        return new Buffer(params,'hex');
    }

    getUID() {
        return this.device.getUID();//('0000' + this.device.getUID()).substr(-12);
    }

}
module.exports = adapter;
