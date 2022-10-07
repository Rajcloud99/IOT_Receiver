/**
 * Created by Kamal on 17-07-2020.
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
         //ATL,L,868345038188025,N,210921,063501,A,028.663399,N,077.092392,E,000.0,GPS,3461,404,11,01068,042883@
         //ATL,L,866104026698764,N,111116,085531,A,028.123456,N,077.123456,E,000.0,GPS,4180,404,11,00159,064753@
         data = data.toString();
         fs.appendFile('atlanta.txt', new Date() + ' : '+ data+'\n', function (err) {});
         const parts = {};
         parts.org = data;
         data = data.split(',');
         parts.device_id = parseInt(data[2]);
         parts.packatId = data[2];
         parts.cmd = data[3];
         parts.data = data;
         parts.original = data;
         if(parts.cmd == 'N'){
             parts.action = "ping";
             parts.packat_type = data[3];
             if(!this.device.getUID()){
                 parts.device_id = parseInt(data[2]);
                 this.device.setUID(parts.device_id);
                 this.device.login_request(parts);
             }
         }else{
             //consider alert
             parts.action = "alarm";
             //2 Byte information specifying type of packet. See Table 7: Packet Types for more information
             parts.packat_type = data[3];
             //2 Byte alert ID indicating type of packet see Table 8: Alert ID List for more information
             parts.alertId = data[4];
             if(data[51] && (data[51].toLocaleLowerCase().search('rfid') == 0)){
                 parts.packat_type = 'rfid';
                 parts.rfid = data[51].split(':')[1];
             }
             if(!this.device.getUID()){
                 parts.device_id = parseInt(data[1]);
             }
         }
         return parts;
     }
 
     get_ping_data(msg_parts) {
         //TODO handle bulk memory data
         const str = msg_parts.data;
         //ATL,L,866104026698764,N,111116,085531,A,028.123456,N,077.123456,E,000.0,GPS,4180,404,11,00159,064753@
         const data = {
             device_id: this.device.getUID() || str[2],
             validity:str[6] == 'A',
             real_time:str[1] == 'L',
             lat: parseFloat(str[7]),
            // ns: str[12],
             lng: parseFloat(str[9]),
             speed: parseInt(str[11]),
             gps_tracking : str[12]=='GPS',
             course: 0,
             mnc:str[15],
             lac:str[16],
             cid:str[17]
            //satellites:parseInt(str[12]),
            // gps_fix:str[8],
            // altitude:parseFloat(str[16]),//altitude in mtr
            //ignition:parseInt(str[6]),
            //power_off:str[7]==0,
            //box_open:str[8]==1,
            //odometer: parseInt(str[10]),

         };
 
         //data.original = msg_parts.original;
 
         //data.lat = data.ns === 'N' ? data.lat : -1 * data.lat;
         //data.lng = data.ew === 'E' ? data.lng : -1 * data.lng;
         let dateStr = str[4].toString();
         let day = parseInt(dateStr.substr(0, 2));
         if(day.toString() && day.toString().length === 1){
             day= "0"+day.toString();
         }
         let month = parseInt(dateStr.substr(2, 2));
         if(month.toString() && month.toString().length === 1){
             month= "0"+month.toString();
         }
         let year = "20" + parseInt(dateStr.substr(4, 2));
 
         let timeStr = str[5].toString();
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
             case "EMR":
                 console.log('rfid','SET EO');
                 //this.send_command('SET EO');
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
         data.location = this.get_ping_data(msg_parts);
        
         this.device.ping(data.location, true);
 
         this.answer_alarm(msg_parts.packat_type);
 
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
