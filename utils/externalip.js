const request = require('request');

module.exports.getIpAsync = () => {
	return new Promise((resolve, reject) => {
		getIp((err, res) => {
			if(err) return reject(err);
			resolve(res);
		});
	});
};

function getIp(callback) {
	const url = 'http://169.254.169.254/latest/meta-data/public-ipv4';
	request(url, {
        timeout: 1000
    }, function(error, response, body) {
        if (error) {
            // winston.info(error);
            return callback(null, 'localhost');
        }
        callback(null, body);
    });
}
