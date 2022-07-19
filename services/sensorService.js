const request = require('request');

function cbTest(err,resp){
    console.log('getSensorAsync cbTest ',err,resp);
}

exports.getSensorAsync = (query) => {
    return new Promise((resolve, reject) => {
        exports.getSensor(query, (err, res) => {
            if(err) return reject(err);
            resolve(res);
        });
    });
};

exports.getSensor = function (query, callback) {
    if (!query) return callback(null, '');
    query.projection = {"device":1,m_fact:1};
    if (process.env.NODE_ENV === 'servertest') return callback(null, null);
    const url = "http://13.229.178.235:4242/sensor/get";
    let options = {
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

//exports.getSensor(23.912817,76.907038,cbTest);
let oSensorFilter = {
    device : 1324
};
//exports.getSensorAsync(23.912817,76.907038,cbTest);
