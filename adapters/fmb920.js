/**
 * Created by kamal on 04-08-2020.
 */
const devices = require('../config').devices;
const converter = require('../utils/converter');
const fs = require('fs');
var binutils = require('binutils64');

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
    parse_data(data)  {
        var data=new Buffer(data,'hex');
        //TODO can use logone
        var buf;
        if (data instanceof Buffer) {
            buf = data;
        } else {
            buf = converter.stringToBytes(data);
        }
        const parts = {org:buf};
        let that = this;
        let start = converter.bytesToInt(buf, 0, 2);
        if(start == 15){
            //get imei
            data = converter.byteArrayToHexString(data);
            parts.cmd = '01';
            parts.device_id = converter.hex2bin(data.substr(4,data.length-1));
            parts.device_id = parseInt(parts.device_id);
            parts.action = "login_request";
        }else{
            let gps = [];
            let sizeAVL = converter.bytesToInt(buf, 4, 4);

            let rCRC = converter.bytesToInt(buf, buf.length - 4, 4);

            let cCRC = converter.crc16(buf, 8, sizeAVL);

            let i = 8;
            parts.device_id = this.device.getUID();
            if (sizeAVL == buf.length - 4 * 3 && rCRC == cCRC) {

                let codec = converter.bytesToInt(buf, i, 1);
                i++;
                //no of data
                let recs = converter.bytesToInt(buf, i, 1);

                //this.send_command(this.getCommandCustom(recs.toString()));
                i++;
                //  console.log(codec, recs);
                if (codec == 0x08) {
                    for (var n = 0; n < recs; n++) {
                        if(!parts.action){
                            parts.action = "ping";
                            parts.cmd = '02';
                        }
                        var position = {};
                        position.datetime = converter.bytesToInt(buf, i, 8);
                        position.datetime = new Date(position.datetime);
                        position.device_id = this.device.getUID() || this.device.uid;

                        i += 8;

                        position.priority = converter.bytesToInt(buf, i, 1);
                        i++;

                        position.lng = converter.bytesToIntDemo(buf, i, 4) / 10000000.0;
                        //  console.info('lng', bytesToIntDemo(buf, i, 4));


                        i += 4;

                        position.lat =  converter.bytesToIntDemo(buf, i, 4) / 10000000.0;
                        //  bytesToIntDemo(buf, i, 4)
                        i += 4;

                        position.altitude = converter.bytesToInt(buf, i, 2);
                        i += 2;

                        position.dir = converter.bytesToInt(buf, i, 2);
                        position.course = position.dir;
                        position.direction = 0;
                        i += 2;

                        if (position.dir < 90)
                            position.direction = 1;
                        else if (position.dir == 90)
                            position.direction = 2;
                        else if (position.dir < 180)
                            position.direction = 3;
                        else if (position.dir == 180)
                            position.direction = 4;
                        else if (position.dir < 270)
                            position.direction = 5;
                        else if (position.dir == 270)
                            position.direction = 6;
                        else if (position.dir > 270)
                            position.direction = 7;

                        position.satellites = converter.bytesToInt(buf, i, 1);
                        i++;

                        position.status = "";
                        position.alarm = "";

                        if (position.satellite >= 3)
                            position.status = "A";
                        else
                            position.status = "L";

                        position.speed = converter.bytesToInt(buf, i, 2);
                        i += 2;

                        position.ioEvent = converter.bytesToInt(buf, i, 1);
                        i++;

                        position.ioCount = converter.bytesToInt(buf, i, 1);
                        i++;

                        //read 1 byte
                        {
                            var cnt = converter.bytesToInt(buf, i, 1);
                            i++;
                            for (var j = 0; j < cnt; j++) {
                                var id = converter.bytesToInt(buf, i, 1);
                                i++;
                                //Add output status

                                switch (id) {
                                    case 239:
                                    {
                                        var value = converter.bytesToInt(buf, i, 1);
                                        position.ignition = value == 1 ? 1 : 0;
                                        i++;
                                        break;
                                    }
                                    case 180:
                                    {
                                        var value = converter.bytesToInt(buf, i, 1);
                                        position.out2 = value == 1 ? 1 : 0;
                                        i++;
                                        break;
                                    }
                                    case 2:
                                    {
                                        var value = converter.bytesToInt(buf, i, 1);
                                        position.sos = value == 1 ? 1 : 0;
                                        if(value == 1){
                                            console.log('FMB 910 SOS  ',this.device.getUID());
                                            parts.action = "alarm";
                                            position.alarm = 'sos';
                                            parts.cmd = 'sos';
                                        }
                                        if(this.device.getUID() == this.device.logOne && value == 1){
                                            console.log(this.device.logOne,'SOS value ',position.sos);
                                            fs.appendFile('fmb910'+this.device.logOne+'.txt', new Date() + ' SOS: '+ parts.org.toString('hex')+'\n', function (err) {});
                                            fs.appendFile('fmb910'+this.device.logOne+'.txt', new Date() + ' SOS: '+ parts.org.toString()+'\n', function (err) {});
                                        }
                                        i++;
                                        break;
                                    }
                                    case 'GSM':
                                    {
                                        var value = converter.bytesToInt(buf, i, 1);
                                        // position.status += string.format(",GSM {0}", value);
                                        i++;
                                        break;
                                    }
                                    case 'STOP':
                                    {
                                        var value = converter.bytesToInt(buf, i, 1);
                                        position.stopFlag = value == 1;
                                        position.isStop = value == 1;
                                        i++;
                                        break;
                                    }
                                    case 'IMMOBILIZER':
                                    {
                                        var value = converter.bytesToInt(buf, i, 1);
                                        position.alarm = value == 0 ? "Activate Anti-carjacking success" : "Emergency release success";
                                        i++;
                                        break;
                                    }
                                    case 253:
                                    {
                                        parts.action = "alarm";
                                        parts.cmd = '03';
                                        var value = converter.bytesToInt(buf, i, 1);
                                        //console.log('accelerometer reading', 253,value);
                                        switch (value) {
                                            case 1:
                                            {
                                                position.alarm = "ha";
                                                break;
                                            }
                                            case 2:
                                            {
                                                position.alarm = "hb";
                                                break;
                                            }
                                            case 3:
                                            {
                                                position.alarm = "rt";
                                                break;
                                            }
                                            default:
                                                break;
                                        }
                                        i++;
                                        break;
                                    }
                                    case 254:
                                    {
                                        parts.action = "alarm";
                                        parts.cmd = '03';
                                        var value = converter.bytesToInt(buf, i, 1);
                                        //console.log('accelerometer reading', 254,value);
                                        switch (value) {
                                            case 1:
                                            {
                                                position.alarm = "ha";
                                                break;
                                            }
                                            case 2:
                                            {
                                                position.alarm = "hb";
                                                break;
                                            }
                                            case 3:
                                            {
                                                position.alarm = "rt";
                                                break;
                                            }
                                            default:
                                                break;
                                        }
                                        i++;
                                        break;
                                    }
                                    case 'GREEDRIVING':
                                    {
                                        parts.action = "alarm";
                                        parts.cmd = '03';
                                        var value = converter.bytesToInt(buf, i, 1);
                                        switch (value) {
                                            case 1:
                                            {
                                                position.alarm = "ha";
                                                break;
                                            }
                                            case 2:
                                            {
                                                position.alarm = "hb";
                                                break;
                                            }
                                            case 3:
                                            {
                                                position.alarm = "rt";
                                                break;
                                            }
                                            default:
                                                break;
                                        }
                                        i++;
                                        break;
                                    }
                                    default:
                                    {
                                        i++;
                                        break;
                                    }
                                }

                            }
                        }

                        //read 2 byte
                        {
                            var cnt = converter.bytesToInt(buf, i, 1);
                            i++;
                            for (var j = 0; j < cnt; j++) {
                                var id = converter.bytesToInt(buf, i, 1);


                                i++;
                                //    console.log('id 2byte', id,bytesToInt(buf, i, 2));
                                id =parseInt(id);
                                switch (id) {
                                    case 66:
                                    {
                                        var value = converter.bytesToInt(buf, i, 2);
                                        position.battery=value/1000;
                                        //if (value < 12)
                                        //  position.alarm += string.format("Low voltage", value);
                                        i += 2;
                                        break;
                                    }
                                    case 67:
                                    {
                                        var value = converter.bytesToInt(buf, i, 2);
                                        position.battery_int=value/1000;
                                        i += 2;
                                        break;
                                    }
                                    case 9:
                                    {
                                        var value = converter.bytesToInt(buf, i, 2);
                                        position.a_input_1=value/1000;
                                        if(this.device.getUID() == this.device.logOne){
                                            console.log(this.device.logOne,'position.a_input_1  ',position.a_input_1);
                                        }
                                        i += 2;
                                        break;
                                    }
                                    case 10:
                                    {
                                        var value = converter.bytesToInt(buf, i, 2);
                                        position.a_input_2=value/1000;
                                        if(this.device.getUID() == this.device.logOne){
                                            console.log(this.device.logOne,'position.a_input_2  ',position.a_input_2);
                                        }
                                        i += 2;
                                        break;
                                    }
                                    case 11:
                                    {
                                        var value = converter.bytesToInt(buf, i, 2);
                                        position.a_input_3=value/1000;
                                        if(this.device.getUID() == this.device.logOne){
                                            console.log(this.device.logOne,'position.a_input_3  ',position.a_input_3);
                                        }
                                        i += 2;
                                        break;
                                    }

                                    case 'SPEED':
                                    {
                                        var value = converter.bytesToInt(buf, i, 2);
                                        //position.alarm += string.format("Speed", value);
                                        i += 2;
                                        break;
                                    }
                                    default:
                                    {
                                        i += 2;
                                        break;
                                    }

                                }
                            }
                        }

                        //read 4 byte
                        {
                            var cnt = converter.bytesToInt(buf, i, 1);
                            i++;
                            for (var j = 0; j < cnt; j++) {
                                var id = converter.bytesToInt(buf, i, 1);
                                i++;


                                switch (parseInt(id)) {
                                    case 'TEMPERATURE':
                                    {
                                        var value = converter.bytesToInt(buf, i, 4);
                                        //position.alarm += string.format("Temperature {0}", value);
                                        i += 4;
                                        break;
                                    }
                                    case 199:
                                    {

                                        var value = converter.bytesToInt(buf, i, 4);
                                        position.mileage = value;
                                        i += 4;
                                        break;
                                    }
                                    default:
                                    {
                                        i += 4;
                                        break;
                                    }
                                }
                            }
                        }

                        //read 8 byte
                        {
                            var cnt = converter.bytesToInt(buf, i, 1);
                            i++;
                            for (var j = 0; j < cnt; j++) {
                                var id = converter.bytesToInt(buf, i, 1);
                                i++;

                                var io = converter.bytesToInt(buf, i, 8);
                                // position.status += string.format(",{0} {1}", id, io);
                                i += 8;
                            }
                        }
                        //console.log(socket.device_imei);
                        //  by now, must be guaranteed: socket.hasOwnProperty('device_imei') == true
                        //var imei = socket.device_imei;

                        if ((position.lng != 0 || position.lat != 0) &&  (position.datetime instanceof Date)) {
                            // var resData = {  utcDateTime: position.timestamp, lat: position.lat, lng: position.lng, altitude: position.alt, orientation: position.dir, speed: position.speed,acc:position.acc,battery:position.battery,out2:position.out2,sos:position.sos,a_input_1:position.a_input_1,a_input_2:position.a_input_2,a_input_3:position.a_input_3,p:position };
                            position.datetime = position.datetime.getTime();
                            gps.push(position);
                            parts.data = position;
                            parts.aData = gps;
                            //console.log(position.datetime);
                        }
                    }
                }else if (codec == 0x8E) {
                    for (var n = 0; n < recs; n++) {
                        try {
                            if (!parts.action) {
                                parts.action = "ping";
                                parts.cmd = '02';
                            }
                            var position = {};
                            position.datetime = converter.bytesToInt(buf, i, 8);
                            position.datetime = new Date(position.datetime);
                            position.device_id = this.device.getUID() || this.device.uid;

                            i += 8;

                            position.priority = converter.bytesToInt(buf, i, 1);
                            i++;

                            position.lng = converter.bytesToIntDemo(buf, i, 4) / 10000000.0;
                            //  console.info('lng', bytesToIntDemo(buf, i, 4));


                            i += 4;

                            position.lat = converter.bytesToIntDemo(buf, i, 4) / 10000000.0;
                            //  bytesToIntDemo(buf, i, 4)
                            i += 4;

                            position.altitude = converter.bytesToInt(buf, i, 2);
                            i += 2;

                            position.dir = converter.bytesToInt(buf, i, 2);
                            position.course = position.dir;
                            position.direction = 0;
                            i += 2;

                            if (position.dir < 90)
                                position.direction = 1;
                            else if (position.dir == 90)
                                position.direction = 2;
                            else if (position.dir < 180)
                                position.direction = 3;
                            else if (position.dir == 180)
                                position.direction = 4;
                            else if (position.dir < 270)
                                position.direction = 5;
                            else if (position.dir == 270)
                                position.direction = 6;
                            else if (position.dir > 270)
                                position.direction = 7;

                            position.satellites = converter.bytesToInt(buf, i, 1);
                            i++;

                            position.status = "";
                            position.alarm = "";

                            if (position.satellite >= 3)
                                position.status = "A";
                            else
                                position.status = "L";

                            position.speed = converter.bytesToInt(buf, i, 2);
                            i += 2;
//0000 – IO element ID of Event generated (in this case when 0000 – data generated not on event) - 2bytes
                            position.ioEvent = converter.bytesToInt(buf, i, 2);
                            i += 2;
                            //   IO elements in record (total) - 2 bytes
                            position.ioCount = converter.bytesToInt(buf, i, 2);
                            i += 2;
// IO elements list
                            //https://wiki.teltonika-gps.com/wikibase/index.php?title=FMB920_Teltonika_Data_Sending_Parameters_ID&mobileaction=toggle_view_desktop
                            //read 1 byte
                            {
                                // no of IO elements, which length is 1 Byte
                                var cnt = converter.bytesToInt(buf, i, 2);
                                i += 2;

                                for (var j = 0; j < cnt; j++) {
                                    //IO element ID 2 byte
                                    var id = converter.bytesToInt(buf, i, 2);
                                    i += 2;
                                    //Add output status
                                    //IO element’s value 1 byte
                                    switch (id) {
                                        case 239: {
                                            var value = converter.bytesToInt(buf, i, 1);
                                            position.ignition = value == 1 ? 1 : 0;
                                            i++;
                                            break;
                                        }
                                        case 180: {
                                            var value = converter.bytesToInt(buf, i, 1);
                                            position.out2 = value == 1 ? 1 : 0;
                                            i++;
                                            break;
                                        }
                                        case 2: {
                                            var value = converter.bytesToInt(buf, i, 1);
                                            position.sos = value == 1 ? 1 : 0;
                                            if (value == 1) {
                                                console.log('FMB 920 SOS  ', this.device.getUID());
                                                parts.action = "alarm";
                                                position.alarm = 'sos';
                                                parts.cmd = 'sos';
                                            }
                                            if (this.device.getUID() == this.device.logOne && value == 1) {
                                                console.log(this.device.logOne, 'SOS value ', position.sos);
                                                fs.appendFile('fmb920' + this.device.logOne + '.txt', new Date() + ' SOS: ' + parts.org.toString('hex') + '\n', function (err) {
                                                });
                                            }
                                            i++;
                                            break;
                                        }
                                        case 253: {
                                            parts.action = "alarm";
                                            parts.cmd = '03';
                                            var value = converter.bytesToInt(buf, i, 1);
                                            //console.log('accelerometer reading', 253,value);
                                            switch (value) {
                                                case 1: {
                                                    position.alarm = "ha";
                                                    break;
                                                }
                                                case 2: {
                                                    position.alarm = "hb";
                                                    break;
                                                }
                                                case 3: {
                                                    position.alarm = "rt";
                                                    break;
                                                }
                                                default:
                                                    break;
                                            }
                                            i++;
                                            break;
                                        }
                                        case 254: {
                                            parts.action = "alarm";
                                            parts.cmd = '03';
                                            var value = converter.bytesToInt(buf, i, 1);
                                            switch (value) {
                                                case 1: {
                                                    position.alarm = "ha";
                                                    break;
                                                }
                                                case 2: {
                                                    position.alarm = "hb";
                                                    break;
                                                }
                                                case 3: {
                                                    position.alarm = "rt";
                                                    break;
                                                }
                                                default:
                                                    break;
                                            }
                                            i++;
                                            break;
                                        }
                                        default: {
                                            i++;
                                            break;
                                        }
                                    }

                                }
                            }

                            //read 2 byte
                            {
                                // IO elements, which length is 2 Byte
                                var cnt = converter.bytesToInt(buf, i, 2);
                                i += 2;
                                for (var j = 0; j < cnt; j++) {
                                    // IO element ID - 2 byte
                                    var id = converter.bytesToInt(buf, i, 2);
                                    i += 2;
                                    //    console.log('id 2byte', id,bytesToInt(buf, i, 2));
                                    id = parseInt(id);
                                    //IO element’s value 2 byte
                                    switch (id) {
                                        case 66: {
                                            var value = converter.bytesToInt(buf, i, 2);
                                            position.battery = value / 1000;
                                            //  if (value < 12)
                                            //      position.alarm += string.format("Low voltage", value);
                                            i += 2;
                                            break;
                                        }
                                        case 67: {
                                            var value = converter.bytesToInt(buf, i, 2);
                                            position.battery_int = value / 1000;
                                            i += 2;
                                            break;
                                        }
                                        case 9: {
                                            var value = converter.bytesToInt(buf, i, 2);
                                            position.a_input_1 = value / 1000;
                                            if (this.device.getUID() == this.device.logOne) {
                                                console.log(this.device.logOne, 'position.a_input_1  ', position.a_input_1);
                                            }
                                            i += 2;
                                            break;
                                        }
                                        case 10: {
                                            var value = converter.bytesToInt(buf, i, 2);
                                            position.a_input_2 = value / 1000;
                                            if (this.device.getUID() == this.device.logOne) {
                                                console.log(this.device.logOne, 'position.a_input_2  ', position.a_input_2);
                                            }
                                            i += 2;
                                            break;
                                        }
                                        case 11: {
                                            var value = converter.bytesToInt(buf, i, 2);
                                            position.a_input_3 = value / 1000;
                                            if (this.device.getUID() == this.device.logOne) {
                                                console.log(this.device.logOne, 'position.a_input_3  ', position.a_input_3);
                                            }
                                            i += 2;
                                            break;
                                        }

                                        case 13: {
                                            var value = converter.bytesToInt(buf, i, 2);
                                            position.afu = value;
                                            console.log(this.device.logOne, ' position.avg_fuel_used  ', position.afu);
                                            fs.appendFile('fmb920_avg_fuel_used' + this.device.logOne + '.txt', new Date() + ' : ' + position.afu + '\n', function (err) {
                                            });
                                            if (this.device.getUID() == this.device.logOne) {
                                                //  console.log(this.device.logOne,'position.a_input_3  ',position.a_input_3);
                                            }
                                            i += 2;
                                            break;
                                        }
                                        //   270 - Escort LLS Fuel level #1
                                        case 270: {
                                            var value = converter.bytesToInt(buf, i, 2);
                                            position.fl = value;
                                            i += 2;
                                            if (this.device.fuel_sensor_m_fact) {
                                                position.f_lvl = this.device.fuel_sensor_m_fact * position.fl;
                                            }

                                            let dt = new Date();
                                            dt.toLocaleString();
                                            if (this.device.getUID() == this.device.logOne) {
                                                let msg = dt + ' : ' + position.fl + ' f_lvl ' + position.f_lvl + ' m_fact ' + this.device.fuel_sensor_m_fact + '\n';
                                                console.log(msg);
                                                fs.appendFile('fmb920_escort_fuel_level_1' + this.device.logOne + '.txt', msg, function (err) {
                                                });
                                            }
                                            break;
                                        }
                                        default: {
                                            i += 2;
                                            break;
                                        }

                                    }
                                }
                            }

                            //read 4 byte
                            {
                                // IO elements, which length is 4 Byte - 2 byte
                                var cnt = converter.bytesToInt(buf, i, 2);
                                i += 2;
                                for (var j = 0; j < cnt; j++) {
                                    // IO element ID 2 byte
                                    var id = converter.bytesToInt(buf, i, 2);
                                    i += 2;

                                    // io element value 4 byte
                                    switch (parseInt(id)) {
                                        case 199: {

                                            var value = converter.bytesToInt(buf, i, 4);
                                            position.mileage = value;
                                            i += 4;
                                            break;
                                        }
                                        case 12: {

                                            var value = converter.bytesToInt(buf, i, 4);
                                            position.fuel_used_gps = value;
                                            console.log(this.device.logOne, '12 position.fuel_used_gps  ', position.fuel_used_gps);
                                            fs.appendFile('fmb920_fuel_used_gps' + this.device.logOne + '.txt', new Date() + ' : ' + position.fuel_used_gps + '\n', function (err) {
                                            });
                                            if (this.device.getUID() == this.device.logOne) {
                                                //  console.log(this.device.logOne,'position.a_input_3  ',position.a_input_3);
                                            }
                                            i += 4;
                                            break;
                                        }
                                        default: {
                                            i += 4;
                                            break;
                                        }
                                    }
                                }
                            }

                            //read 8 byte
                            {
                                //io element length of 8 byte
                                var cnt = converter.bytesToInt(buf, i, 2);
                                i += 2;
                                for (var j = 0; j < cnt; j++) {
                                    //io element id 2 byte
                                    var id = converter.bytesToInt(buf, i, 2);
                                    i += 2;
// io value of 8 bytes
                                    var io = converter.bytesToInt(buf, i, 8);
                                    // position.status += string.format(",{0} {1}", id, io);
                                    i += 8;
                                }
                            }

                            //read X byte
                            {
                                var cnt = converter.bytesToInt(buf, i, 2);
                                i += 2;
                                for (var j = 0; j < cnt; j++) {
                                    var id = converter.bytesToInt(buf, i, 2);
                                    i += 2;
                                    var idLenth = converter.bytesToInt(buf, i, 2);
                                    i += 2;

                                    var io = converter.bytesToInt(buf, i, idLenth);
                                    // position.status += string.format(",{0} {1}", id, io);
                                    i += idLenth;
                                }
                            }

                            if (this.device.getUID() == this.device.logOne) {
                                console.log('fmb920 position data pos1 ', position.lng, position.lat, position.datetime);
                            }
                            if ((position.lng != 0 && position.lat != 0) && (position.datetime instanceof Date)) {
                                position.datetime = position.datetime.getTime();
                                gps.push(position);
                                parts.data = position;
                                parts.aData = gps;
                                if (this.device.getUID() == this.device.logOne) {
                                    console.log('fmb920 position data pos2', position.f_lvl, position.fl);
                                }
                            }
                        } catch (e) {
                            console.error('error from fmb 920 loop', e.message, e);
                        }
                    }
                }

                let writer = new binutils.BinaryWriter();
                writer.WriteInt32(recs);
                this.device.send(writer.ByteBuffer);
            }
        }
        if(this.device.getUID() == this.device.logOne){
            fs.appendFile('fmb920'+this.device.logOne+'.txt', new Date() + ' : '+ parts.org+'\n', function (err) {});
        }
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
        let alarm_code;
        let data = {};
        for(let i=0;i<(msg_parts.aData && msg_parts.aData.length);i++){
            if(msg_parts.aData[i].alarm){
                alarm_code = msg_parts.aData[i].alarm;
                data.location = msg_parts.aData[i];
                //console.log('FMB 910 receive_alarm',alarm_code);
                break;
            }
        }
        //this.answer_alarm(alarm_code);
        msg_parts.data.alarm_terminal = alarm_code;
        msg_parts.data.alarm_code = alarm_code;
        data.alarm_code = alarm_code;
        data.alarm_terminal = alarm_code;
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
        return msg_parts.data;
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

     getFuelInfoFromCalib(sensorData,c_lvl){
        let f_lvl;
        if(sensorData && sensorData.calib){
            for(let i=0;i<sensorData.calib.length;i++){

            }
        }

        return f_lvl;
    }

}
module.exports = adapter;
