/**
 * Created by Kamal on 03-02-2020.
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
        const parts = {};
        parts.org = data;
        //'$,CP,ASPL,V1.1.1,NR,01,L,864495039252728,DL1RQ2455,1,21082018,102209,28.359692,N,76.927437,E,0.0,36.00,8,269.0,1.2,1.7,Airtel P N,0,1,12.2,4.0,0,C,25,404,10,209,c342,6d17,209,24,d2fb,209,20,d2fc,209,19,c344,209,19,0111,0  0,002165,125.4,A,,?*'
        data = data.split(',');
        //const error_code = this.get_error_code(data.substr(0, data.length - 4));
        //parts.start = data[0];
        // parts.time = data.substr(1, 12);
        parts.cmd = data[1];
        parts.data = data;
        //
        //parts.end = data[data.length - 1];
        switch (parts.cmd) {
            //login
            case 'VRN':
                parts.action = "login_request";
                parts.vehicle = data[1];
                parts.device_id = parseInt(data[2]);
                parts.fVer = data[3];
                parts.lat = data[4];
                parts.latDir = data[5];
                parts.lng = data[6];
                parts.lngDir = data[7];
                break;
            case '':
                parts.action = "login_request";
                parts.vehicle = data[1];
                parts.device_id = parseInt(data[2]);
                parts.fVer = data[3];
                parts.lat = data[4];
                parts.latDir = data[5];
                parts.lng = data[6];
                parts.lngDir = data[7];
                break;
            //Health Monitoring
            case 'HP':
                //$,HP,ASPL,V1.1.1,867556043893406,100.00,05,0.00,10,30,1011,0.00,0.00,*
                parts.action = "heartbeat";
                parts.vendorId = data[2];
                parts.fVer = data[2];
                parts.device_id = parseInt(data[4]);
                parts.battery = parts.data[5];
                //Indicates flash memory % used
                parts.memory = parts.data[6];
                //Indicates packet frequency when ignition is on in seconds
                parts.packat_ignition_on = parts.data[7];
                //Indicates packet frequency when ignition is off in seconds
                parts.packat_ignition_off = parts.data[8];
                //Digital Input status order:[DIN3, DIN2, DIN1, DIN0] -> 0000
                parts.dig_input = parts.data[9];
                //Analog Input status -> 00
                parts.analog_input = parts.data[10];
                break;
            //PING -> When the gps sends their position
            case 'CP':
                parts.action = "ping";
                parts.vendorId = data[2];
                parts.fVer = data[3];
                //2 Byte information specifying type of packet. See Table 7: Packet Types for more information
                parts.packat_type = data[4];
                if(!this.device.getUID()){
                    parts.device_id = parseInt(data[7]);
                    //this.device.setUID(parts.device_id);
                    //this.device.login_request(parts);
                }
                if(parts.packat_type == 'EA'){
                    parts.action = "alarm";
                    console.log('SOS Atlanta ',parts.device_id);
                    fs.appendFile('atlanta_ais140_sos'+this.device.logOne+'.txt', new Date() + ' : '+ parts.org+'\n', function (err) {});

                }
                //2 Byte alert ID indicating type of packet see Table 8: Alert ID List for more information
                parts.alertId = data[5];

                break;
            case '$ALT':
                parts.action = "alarm";
                parts.vendorId = data[1];
                parts.fVer = data[2];
                //2 Byte information specifying type of packet. See Table 7: Packet Types for more information
                parts.packat_type = data[4];
                //2 Byte alert ID indicating type of packet see Table 8: Alert ID List for more information
                parts.alertId = data[4];
                if(data[51] && (data[51].toLocaleLowerCase().search('rfid') == 0)){
                    parts.packat_type = 'rfid';
                    parts.rfid = data[51].split(':')[1];
                }
                if(!this.device.getUID()){
                    parts.device_id = parseInt(data[6]);
                    //this.device.setUID(parts.device_id);
                    //this.device.login_request(parts);
                }
                if(this.device.getUID() == this.device.logOne){
                    console.log(this.device.logOne,parts.org);
                    // fs.appendFile('ais140Alerts.txt', new Date() + ' : '+ parts.org+'\n', function (err) {});
                }
                break;
            case '$EPB':
                parts.action = "alarm";
                //parts.vendorId = data[1];
                //2 Byte information specifying type of packet. See Table 7: Packet Types for more information
                parts.packat_type = data[1];
                //2 Byte alert ID indicating type of packet see Table 8: Alert ID List for more information
                parts.pstatus = data[3];
                if(!this.device.getUID()){
                    parts.device_id = parseInt(data[2]);
                    //this.device.setUID(parts.device_id);
                    //this.device.login_request(parts);
                }
                //fs.appendFile('ais140EPB.txt', new Date() + ' : '+ parts.org+'\n', function (err) {});
                break;
            default:
                parts.action = "other";
        }
        if(this.device.getUID() == this.device.logOne){
            console.log(this.device.logOne,parts.org);
            fs.appendFile('atlanta_ais140-'+this.device.logOne+'.txt', new Date() + ' : '+ parts.org+'\n', function (err) {});
        }
        return parts;
    }

    get_ping_data(msg_parts) {
        const str = msg_parts.data;
        //$NRM,ROADRPA,2.0ATRFID,NR,02,H,869867036977819,,0,03022020,112123,0.00000000,N,0.00000000,E,0.0,0.00,0,0.0,22.20,22.20,,0,1,28.0,5.1,0,C,29,404,11,03F6,CFE6,23,03F6,6F9C,00,0000,0000,00,0000,0000,00,0000,0000,1100,00,15030,15140,000032,0.000,-,-,-,-,5_5_4_4_2,92CF9BF3*
        //
        const data =  {
            real_time : str[6]=='L',
            device_id: this.device.getUID() || str[7],
            vehicle_no:str[8],
            gps_tracking:str[9] == 1,
            lat: parseFloat(str[12]),
            ns: str[13],
            lng: parseFloat(str[14]),
            ew: str[15],
            speed: parseInt(str[16]),
            course: parseInt(str[17]),
            satellites:parseInt(str[18]),
            altitude:str[19],
            pdop:str[20],
            hdopL:str[21],
            operator:str[22],
            ignition:parseInt(str[23]),
            power_off:str[24],
            input_voltage:str[25],
            battery_voltage:str[26],
            emergency:str[27],
            temper:str[28],
            gsm:str[29],
            mcc:parseInt(str[30]),
            mnc:parseInt(str[31]),
            lac:str[32],
            cellId:str[33],
            nmr:str[34],
            input_state: str[35],
            out_state: str[36],
            analog_input1:str[37],
            analog_input2:str[38],
            frame_no:str[39],
            odometer: parseInt(str[40]),
            msc1:str[41],
            msc2:str[42],
            msc3:str[43],
            msc4:str[44],
            intr:str[45],
            intr1:str[46],
            intr2:str[47],
        };
        if(data.intr1){
            if(data.intr1[1] == 1){
                data.sb = true;
            }
            if(data.intr1[1] == 0){
                data.sb = false;
            }
        }
        if((this.device.getUID() == 862549047304947) ||   (this.device.getUID() == 862549047304525)){
            console.log('SB',data.sb,data.intr1,this.device.getUID());
        }


        data.lat = data.ns === 'N' ? data.lat : -1 * data.lat;
        data.lng = data.ew === 'E' ? data.lng : -1 * data.lng;
        let dateStr = str[10].toString();
        let day = parseInt(dateStr.substr(0, 2));
        if(day.toString() && day.toString().length === 1){
            day= "0"+day.toString();
        }
        let month = parseInt(dateStr.substr(2, 2));
        if(month.toString() && month.toString().length === 1){
            month= "0"+month.toString();
        }
        //  let year = "20" + parseInt(dateStr.substr(6, 2));
        let year =  parseInt(dateStr.substr(4, 4));
        let timeStr = str[11].toString();
        let hr = parseInt(timeStr.substr(0, 2));
        if(hr.toString() && hr.toString().length === 1){
            hr= "0"+hr.toString();
        }
        let min = parseInt(timeStr.substr(2, 2));
        if(min.toString() && min.toString().length === 1){
            min= "0"+min.toString();
        }
        let sec = parseInt(timeStr.substr(4, 2));
        if(sec.toString() && sec.toString().length === 1){
            sec= "0"+sec.toString();
        }
        let datetime = year + "-" + month + "-" + day + "T" +hr+":"+min+":"+sec+".000Z";
        //console.log(data.device_id,datetime,data.original);
        //console.log(datetime);
        data.datetime = new Date(datetime).getTime();
        /*
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
             this.device.updateBooleanReport('ac', data.ac_on, data.datetime);
             this.device.updateBooleanReport('acc', data.acc_high, data.datetime);

      */
        //console.log(data);
        return data;
    }

    get_emr_ping_data(msg_parts) {
        const str = msg_parts.data;
        //$NRM,ROADRPA,2.0ATRFID,NR,02,H,869867036977819,,0,03022020,112123,0.00000000,N,0.00000000,E,0.0,0.00,0,0.0,22.20,22.20,,0,1,28.0,5.1,0,C,29,404,11,03F6,CFE6,23,03F6,6F9C,00,0000,0000,00,0000,0000,00,0000,0000,1100,00,15030,15140,000032,0.000,-,-,-,-,5_5_4_4_2,92CF9BF3*
        const data = {
            real_time : str[3]=='NM',
            device_id: this.device.getUID() || str[2],
            gps_tracking:true,//str[6] == 1,
            lat: parseFloat(str[6]),
            ns: str[7],
            lng: parseFloat(str[8]),
            ew: str[9],
            altitude:str[10],
            speed: parseInt(str[11]),
            odometer: parseInt(str[12]),
            operator:str[13],
            vehicle_no:str[14],
            //reply_no:str[15],
            // mcc:str[17],
            //mnc:str[18],
            // lac:str[19],
            //cellId:str[20]
            //course: parseInt(str[16]),
        };

        //data.original = msg_parts.original;

        data.lat = data.ns === 'N' ? data.lat : -1 * data.lat;
        data.lng = data.ew === 'E' ? data.lng : -1 * data.lng;
        let dateStr = str[4].toString();
        let day = parseInt(dateStr.substr(0, 2));
        if(day.toString() && day.toString().length === 1){
            day= "0"+day.toString();
        }
        let month = parseInt(dateStr.substr(2, 2));
        if(month.toString() && month.toString().length === 1){
            month= "0"+month.toString();
        }
        let year = parseInt(dateStr.substr(4, 4));

        // let timeStr = str[5].toString();
        let hr = parseInt(dateStr.substr(8, 2));
        if(hr.toString() && hr.toString().length === 1){
            hr= "0"+hr.toString();
        }
        let min = parseInt(dateStr.substr(10, 2));
        if(min.toString() && min.toString().length === 1){
            min= "0"+min.toString();
        }
        let sec = parseInt(dateStr.substr(12, 2));
        if(sec.toString() && sec.toString().length === 1){
            sec= "0"+sec.toString();
        }
        let datetime = year + "-" + month + "-" + day + "T" +hr+":"+min+":"+sec+".000Z";
        data.datetime = new Date(datetime).getTime();
        // console.log(data);
        return data;
    }

    authorize(msg_parts) {
        // var msg = msg_parts.device_id.substr(-12) + 'AP05';
        const msg = this.getUID() + 'AP05';
        // winston.info('authorize', msg);
        //this.send_command(this.getCommandCustom(msg));

        // This device sends location data as well on login, which can be captured here
        // msg_parts.data = msg_parts.data.substr(15);
        //this.device.ping(msg_parts, false);
    }

    answer_alarm(alarm_type) {
        switch (alarm_type) {
            case "IN":
                //console.log('engine on','SET RL:0');
                // this.send_command('SET RL:0');
                break;
            case "IF":
                //console.log('engine off','SET RL:0');
                // this.send_command('SET RL:0');
                break;
            case "rfid":
                console.log('rfid','SET RL:1');
                //this.send_command('SET RL:1');
                break;
            case "EA":
               // console.log('rfid','SET EO');
               // this.send_command('SET EO');
                break;
        }
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

    request_login_to_device(msg_parts) {
        this.device.login_request(msg_parts);
    }

    receive_alarm(msg_parts) {
        const data = {};
        if(msg_parts.packat_type == 'EMR'){
            data.location = this.get_emr_ping_data(msg_parts);
        }else{
            data.location = this.get_ping_data(msg_parts);
        }
        let alTime = data.location && data.location.datetime;
        if(!alTime) return null;
        let diffMsSec = Date.now() - data.location.datetime;
        if(diffMsSec/1000 > 600){//10 min old alarm
            //return null;
        }

        this.device.ping(data.location, true);

       // this.answer_alarm(msg_parts.packat_type);

        data.alarm_terminal = this.get_alarm_terminal(msg_parts.packat_type);

        data.expv = this.get_exception_value(msg_parts.packat_type);

        //this.device.receive_alarm(data.alarm_terminal, true, msg_parts.rfid);

        return data;
    }

    get_exception_value(alarm_code){
        let expval;
        switch (alarm_code) {
            case "RT":
                expval = {val:3,unit:"kp/h/s"};
                break;
            case "HB":
                expval = {val:12,unit:"kp/h/s"};
                break;
            case "HA":
                expval = {val:12,unit:"kp/h/s"};
                break;
        }
        return expval;
    }

    get_alarm_terminal(alarm_code) {
        let alarm;
        switch (alarm_code) {
            case "BD":
                alarm = 'power_cut';
                break;
            case "EA":
                alarm = 'sos';
                break;
            case "TA":
                alarm = 'tempering';
                break;
            /*
        case "EA":
            alarm = 'emergency';
            break;
             */
            case "IN":
                alarm = 'engine_on';
                break;
            case "IF":
                alarm = 'engine_off';
                break;
            case "BR":
                alarm = 'bettery_reconnect';
            case "RT":
                alarm = 'rt';
                break;
            case "HB":
                alarm = 'hb';
                break;
            case "HA":
                alarm = 'ha';
                break;
            case "BL":
                alarm = 'low_internal_battery';
                break;
            case "rfid":
                alarm = 'rfid';
                break;
            case "RFID":
                alarm = 'rfid';
                break;
            case "WD":
                alarm = 'wire_disconnect';
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

    getCommandCustom(command) {
        const start = '(';
        const end = ')';
        return start + command + end;
    }

    get_location() {
        this.sendCommand('location');
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
        //winston.info('sending:', msg);
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
