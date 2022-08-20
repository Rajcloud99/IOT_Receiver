/**
* @Author: kamal
* @Date:   2016-11-10T15:33:38+05:30
*/

const request = require('request');
const config = require('../config');
exports.getAddressAsync = (lat, lng) => {
    return new Promise((resolve, reject) => {
        exports.getAddressFromAWS(lat, lng, (err, res) => {
            if(err) return reject(err);
            resolve(res);
        });
    });
};

exports.getAddress = function(lat, lng, callback) {
    if(process.env.NODE_ENV === 'servertest') return callback(null, null);
    const url = "https://maps.googleapis.com/maps/api/geocode/json?latlng="+lat+","+lng+"&key=AIzaSyBE4mbCTpBNN4ynHx3tzAP5wJgz_lN3pXA";
    //const url = "https://maps.googleapis.com/maps/api/geocode/json?latlng="+lat+","+lng;

    request(url, {
        timeout: 5000
    }, function(error, response, body) {
        if (error) {
            // winston.info(error);
            return exports.getAddressFromMapMyIndia(lat, lng, callback);
            //return exports.getAddressFromAWS(lat, lng, callback);
        }
        body = JSON.parse(body);
        if(!body || !body.results || !body.results[0]){
          	// telegramBotService.sendMessage('google server limit exceeded');
            return exports.getAddressFromMapMyIndia(lat, lng, callback);
          	//return exports.getAddressFromAWS(lat, lng, callback);
        }
        // callback(error, body.display_name);
        // winston.info(JSON.stringify(body.display_name));
        callback(error, body.results[0].formatted_address);
    });
};

exports.getAddressFromAWSAsync = (lat, lng) => {
	return new Promise((resolve, reject) => {
		exports.getAddressFromAWS(lat, lng, (err, res) => {
			if(err) return reject(err);
			resolve(res);
		});
	});
};

exports.getAddressFromAWS  = function (lat, lng, callback) {
	if(process.env.NODE_ENV === 'servertest') return callback(null, null);
    const url = config.geographyUrl + "reverse?lat=" + lat + "&lon=" + lng;
    request(url, {
        timeout: 5000
    }, function(error, response, body) {
        if (error) {
            //winston.error(error);
            return callback(error);
        }
        try {
			body = JSON.parse(body);
			//winston.info(body.display_name);
			callback(error, body.display_name);
		} catch(err) {
        	callback(err);
		}


    });
};

exports.getAddressFromGeographyAsync = (lat, lng) => {
    return new Promise((resolve, reject) => {
        exports.getAddressFromGeography(lat, lng, (err, res) => {
            if(err) return reject(err);
            resolve(res);
        });
    });
};

exports.getAddressFromGeographyV2Async = (oSettings) => {
    return new Promise((resolve, reject) => {
        exports.getAddressFromGeographyV2(oSettings, (err, res) => {
            if(err) return reject(err);
            resolve(res);
        });
    });
};

exports.getAddressFromGeographyV2  = function (oSettings, callback) {
    if(process.env.NODE_ENV === 'servertest') return callback(null, null);
    const url = config.geographyUrl + "reverse/short?lat=" + oSettings.lat + "&lon=" + oSettings.lng + "&imei=" +oSettings.imei ;

    request(url, {
        timeout: 3000
    }, function(error, response, body) {
        if (error) {
            //winston.error(error);
            return callback(error);
        }
        try {
            body = JSON.parse(body);
            //winston.info(body.display_name);
            callback(error, body.display_name);
        } catch(err) {
            callback(err);
        }


    });
};

exports.getAddressFromGeography  = function (lat, lng, callback) {
    if(process.env.NODE_ENV === 'servertest') return callback(null, null);
    const url = config.geographyUrl + "reverse/short?lat=" + lat + "&lon=" + lng;

    request(url, {
        timeout: 3000
    }, function(error, response, body) {
        if (error) {
            //winston.error(error);
            return callback(error);
        }
        try {
            body = JSON.parse(body);
            //winston.info(body.display_name);
            callback(error, body.display_name);
        } catch(err) {
            callback(err);
        }


    });
};

exports.getBeatFromGeographyAsync = (query) => {
    return new Promise((resolve, reject) => {
        exports.getBeatFromGeography(query, (err, res) => {
            if(err) return reject(err);
            resolve(res);
        });
    });
};

exports.getBeatFromGeography = function (query, callback) {
    if (process.env.NODE_ENV === 'servertest') return callback(null, null);
    const url = config.geographyUrl + "beat/get";

    var options = {
        method: 'POST',
        url: url,
        headers:
            {
                'content-type': 'application/json'
            },
        body: query,
        json: true
    };

    request(options, function (error, response, body) {
        if (error) {
           // throw new Error(error);
            return callback(error);
        }
        if(body && body.data && body.data[0]){
            return callback(null, body.data);
        }else{
            return callback(null, '');
        }
    });
};

exports.getAddressFromMapMyIndia  = function (lat, lng, callback) {
    if(process.env.NODE_ENV === 'servertest') return callback(null, null);
    const lic_key ="vc795p286g3jn764zca481cd27m28hz3";
    const url = "http://apis.mapmyindia.com/advancedmaps/v1/"+lic_key+"/rev_geocode?lat="+lat+"&lng="+lng;
    request(url, {
        timeout: 5000
    }, function(error, response, body) {
        if (error) {
            //winston.error(error);
            //return callback(error);
            return exports.getAddressFromAWS(lat, lng, callback);
        }
        try {
            body = JSON.parse(body);
            if(body && body.results && body.results[0]){
                return callback(error, body.results[0].formatted_address);
            }else{
                return exports.getAddressFromAWS(lat, lng, callback);
                //callback("fetch another",false);
            }
        } catch(err) {
            callback(err);
        }


    });
};
function cbTest(err,resp){
    console.log(err,resp);
}

exports.getLandmarkFromGeographyAsync = (query) => {
    return new Promise((resolve, reject) => {
        exports.getLandmarkFromGeography(query, (err, res) => {
            if(err) return reject(err);
            resolve(res);
        });
    });
};
exports.getLandmarkFromGeography = function (query, callback) {
    if (process.env.NODE_ENV === 'servertest') return callback(null, null);
    const url = config.geographyUrl + "landmark/get";
    var options = {
        method: 'POST',
        url: url,
        headers:
            {
                'content-type': 'application/json'
            },
        body: query,
        json: true
    };

    request(options, function (error, response, body) {
        if (error) {
           // throw new Error(error);
            console.log(error);
            return callback(error);
        }
        if(body && body.data && body.data[0]){
            return callback(null, body.data[0]);
        }else{
            return callback(null, '');
        }
    });
};

exports.addAlerts = function (query, callback) {
    if (process.env.NODE_ENV === 'servertest') return callback(null, null);
    const url = config.geographyUrl + "alert/add";
    var options = {
        method: 'POST',
        url: url,
        headers:
            {
                'content-type': 'application/json'
            },
        body: query,
        json: true
    };

    request(options, function (error, response, body) {
        if (error) {
            throw new Error(error);
            return callback(error);
        }
        if(body && body.data && body.data[0]){
            return callback(null, body.data[0]);
        }else{
            return callback(null, '');
        }
    });
};

exports.upsertAlerts = function (query, callback) {
    if (process.env.NODE_ENV === 'servertest') return callback(null, null);
    const url = config.geographyUrl + "alert/upsert";
    var options = {
        method: 'POST',
        url: url,
        headers:
            {
                'content-type': 'application/json'
            },
        body: query,
        json: true
    };

    request(options, function (error, response, body) {
        if (error) {
            //throw new Error(error);
            return callback(error);
        }
        if(body && body.data && body.data[0]){
            return callback(null, body.data[0]);
        }else{
            return callback(null, '');
        }
    });
};

exports.getAlerts = function (query, callback) {
    if (process.env.NODE_ENV === 'servertest') return callback(null, null);
    const url = config.geographyUrl + "alert/get";
    var options = {
        method: 'POST',
        url: url,
        headers:
            {
                'content-type': 'application/json'
            },
        body: query,
        json: true
    };

    request(options, function (error, response, body) {
        if (error) {
            //throw new Error(error);
            return callback(error);
        }
        if(body && body.data){
            return callback(null, body.data);
        }else{
            return callback(null, '');
        }
    });
};

exports.getAlertsAsync = (query) => {
    return new Promise((resolve, reject) => {
        exports.getAlerts(query, (err, res) => {
            if(err) return reject(err);
            resolve(res);
        });
    });
};
//exports.getAddressFromMapMyIndia(23.912817,76.907038,cbTest);
//exports.getAddress(23.912817,76.907038,cbTest);
//exports.getAddressFromAWS(23.912817,76.907038,cbTest);
