module.exports.hex2bin = function(hexdata) {
    var hex = hexdata || "383632323539353838383334323930", // ASCII HEX: 37="7", 57="W", 71="q"
        bytes = [],
        str;
    for (var i = 0; i < hex.length - 1; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    str = String.fromCharCode.apply(String, bytes);
    return str;
};

module.exports.byteArrayToHexString = function(byteArray) {
    return Array.from(byteArray, function(byte) {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('')
};

module.exports.bytesToInt = function (array, p, size) {
    var value = 0;
    for (var i = p; i <= p + size - 1; i++) {
        // console.log(array[i]);
        value = (value * 256) + array[i];
    }
    return value;
};

module.exports.hexToDec =  function(hex) {
    var result = 0,
        digitValue;

    for (var i = 0; i < hex.length; i++) {
        digitValue = '0123456789abcdefgh'.indexOf(hex[i]);
        result = result * 16 + digitValue;
    }
    return result;
};

module.exports.crc16 = function(data, p, size) {
    var crc16_result = 0x0000;
    for (var i = p; i < p + size; i++) {
        var val = 1 * (data[i]); // +i);
        crc16_result ^= val;
        for (var j = 0; j < 8; j++) {
            crc16_result = crc16_result & 0x0001 ? (crc16_result >> 1) ^ 0xA001 : crc16_result >> 1;
        }
    }
    return crc16_result;
};

module.exports.bytesToString = function(buf) {
    var s = "";
    for (var i = 0, l = buf.length; i < l; i++)
        s += String.fromCharCode(buf[i]);

    return s;
};

module.exports.stringToBytes = function(str) {
    var bytes = [];
    for (var i = 0; i < str.length; ++i) {
        var charCode = str.charCodeAt(i);
        /*
         if (charCode > 0xFF)  // char > 1 byte since charCodeAt returns the UTF-16 value
         {
         throw new Error('Character ' + String.fromCharCode(charCode) + ' can\'t be represented by a US-ASCII byte.');
         }
         */
        bytes.push(charCode);
    }
    return bytes;
};

module.exports.zfill = function (number, width) {
    var numberOutput = Math.abs(number); /* Valor absoluto del número */
    var length = number.toString().length; /* Largo del número */
    var zero = "0"; /* String de cero */

    if (width <= length) {
        if (number < 0) {
            return ("-" + numberOutput.toString());
        } else {
            return numberOutput.toString();
        }
    } else {
        if (number < 0) {
            return ("-" + (zero.repeat(width - length)) + numberOutput.toString());
        } else {
            return ((zero.repeat(width - length)) + numberOutput.toString());
        }
    }
}

module.exports.str_a = function (d, i, f) {
    var str = '';
    f = f * 2;
    k = i + f;
    for (j = i; j < i + f; j++) {
        str += d[j];
    }
    //  console.info(k)

    return str;
}

module.exports.bytesToIntDemo = function(array, p, size) {
    var value = 0;
    var buf2 = new Buffer(4);
    var j=0;
    for (var i = p; i <= p + size - 1; i++) {

        value = (value * 256) + array[i];
        buf2[j]=array[i];
        j++;
    }

    return buf2.readInt32BE();
};
