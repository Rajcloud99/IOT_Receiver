/**
 * Created by Kamal on 17-07-2020.
 */

const devices = require('../config').devices;
const fs = require('fs');
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
        //0×200×01ATL356895037533745,$GPRMC,111719.000,A,2838.0045,N,07713.3707,E,0.00,,120
        // 810,,,A*75$,#10011011000001,0,0,0,12345.67,24.4,4.2,21,MCC,MNC,LAC,CellIDATL0×020×7A
        //ATL869630055549525,$GPRMC,071355,A,2839.5509,N,07706.5589,E,0.0,138,250322,,,*2A,#01011011000000,0,0,0,0.00,33,3.8,24,404,10,71,bfc5ATL*
        data = data.toString();

        const parts = {};
        parts.org = data;
        data = data.split(',');
        parts.start = data[0];
        parts.begin = parts.start.split('ATL')[0];
        parts.device_id = parseInt(parts.start.split('ATL')[1]);
        parts.data = data;
        parts.original = data;
        if (!this.device.getUID()) {
            this.device.setUID(parts.device_id);
            this.device.login_request(parts);
        }
        if(data[3] == 'V'){
            console.error('Invalid data ',parts.device_id,'atlanta-e101');
            return;
        }
        let oAlert =  this.getInputDeatils(data[14]);
        if(oAlert && oAlert.alarm){
            parts.cmd = parts.begin.substr(parts.begin.length - 2, 2) || "02";
            parts.action = "alarm";
            parts.packat_type = oAlert.packat_type;
        }else{
            parts.cmd = parts.begin.substr(parts.begin.length - 2, 2) || "01";
            parts.action = "ping";
            parts.packat_type = "01";
        }
        if(this.device.getUID() == this.device.logOne) {
            fs.appendFile('atlanta_e101-'+this.device.getUID()+'.txt', new Date() + ' : ' + parts.org  + '\n', function (err) {});
        }
        return parts;
    }

    get_ping_data(msg_parts) {
        try{
            const str = msg_parts.data;
            let oInputStatus =  this.getInputDeatils(str[14]);
            const data = {
                device_id: this.device.getUID() || msg_parts.device_id,
                validity:str[3] == 'A',
                real_time:msg_parts.packat_type == '01',
                lat: this.convertToDecimal(str[4]),
                ns: str[5],
                lng: this.convertToDecimal(str[6]),
                ew:str[7],
                speed: 1.852 * parseInt(str[8]), //speed in knots
                gps_tracking : true,
                course: parseFloat(str[9]),
                ignition:oInputStatus.ignition,
                voltage:str[15],
                mnc:str[22],
                lac:str[24],
                power_supply:oInputStatus.power_supply
            };

             if(!str[10]){
                return ;
             }
            let dateStr = str[10].toString();
            let day = parseInt(dateStr.substr(0, 2));
            if(day.toString() && day.toString().length === 1){
                day= "0"+day.toString();
            }
            let month = parseInt(dateStr.substr(2, 2));
            if(month.toString() && month.toString().length === 1){
                month= "0"+month.toString();
            }
            let year = "20" + parseInt(dateStr.substr(4, 2));

            let timeStr = str[2].toString();
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
            data.datetime = new Date(datetime).getTime();
            return data;
        }catch (e) {
            console.error('get_ping_data error atlantae101');
            console.error(e);
            return ;
        }

    }

    authorize(msg_parts) {

    }

    convertToDecimal(strCoordinate){
        if(!strCoordinate || strCoordinate.length < 4){
            return 0.0;
        }
        let strArray = strCoordinate.split('.');
        let num = parseFloat(strArray[0].substr(strArray[0].length - 2) + "." + strArray[1]);
        num = num/60;
        let coordinate = parseFloat(strArray[0].substr(0,strArray[0].length - 2));
        coordinate = coordinate + num;
        return coordinate;
    }

    getInputDeatils(strAlert){
        let oAlert= {};
        if(!strAlert || strAlert.length < 12){
           // console.log('wrong alerts string',strAlert);
            return oAlert;
        }
        oAlert.ignition = strAlert.substr(1,1);
        oAlert.door = strAlert.substr(2,1);
        oAlert.sos = strAlert.substr(3,1);
        oAlert.ac = strAlert.substr(6,1);
        oAlert.power_supply = strAlert.substr(8,1) == 1;
        oAlert.ha = strAlert.substr(9,1);
        oAlert.hb = strAlert.substr(10,1);
        oAlert.arm = strAlert.substr(11,1);
        oAlert.sleep = strAlert.substr(12,1);//0 not in sleep , 1 in sleep
        if(oAlert.sos == 1){
            oAlert.alarm = true;
            oAlert.packat_type = 'SOS';
        }else if(oAlert.ha == 1){
            oAlert.alarm = true;
            oAlert.packat_type = 'HA';
        }else if(oAlert.hb == 1){
            oAlert.alarm = true;
            oAlert.packat_type = 'HB';
        }
        return oAlert;
    }

    run_other(cmd, msg_parts) {
      console.error('other data in atalanta e101');
    }

    request_login_to_device(msg_parts) {
        this.device.login_request(msg_parts);
    }

    receive_alarm(msg_parts) {
        const data = {};
        data.location = this.get_ping_data(msg_parts);

        this.device.ping(data.location, true);

        data.alarm_terminal = this.get_alarm_terminal(msg_parts.packat_type);

        data.expv = this.get_exception_value(msg_parts.packat_type);

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
            case "EMR":
                alarm = 'sos';
                break;
            case "TA":
                alarm = 'tempering';
                break;
            case "EA":
                alarm = 'emergency';
                break;
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
            case "OS":
                alarm = 'over_speed';
                break;
            case "DR":
                alarm = 'device_restart';
                break;
            case "HA":
                alarm = 'ha';
                break;
            case "BL":
                alarm = 'low_internal_battery';
                break;
            case "BH":
                alarm = 'low_battery_charged';
                break;
            case "rfid":
                alarm = 'rfid';
                break;
            case "RFID":
                alarm = 'rfid';
                break;
            case "BD":
                alarm = 'wire_disconnect';
                break;
        }
        return alarm;
    }

    receive_handshake(msg_parts) {
        console.log('handshake packet in atlanta e101');
    }

    receive_string_info(msg_parts) {
        console.log('receive_string_info in atlanta e101');
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
        console.log('sendCommand in atlanta e101');
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
