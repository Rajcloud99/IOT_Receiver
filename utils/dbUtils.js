/**
 * Created by bharath on 26/05/17.
 */

const cassandraDbInstance = require('./cassandraDBInstance');

exports.updateAsync = function(table, data) {
	return new Promise((resolve, reject) => {
		exports.update(table, data, (err, res) => {
			if(err) return reject(err);
			resolve(res);
		});
	});
};

// Accepts table name and data object.
// All the fields in the data are inserted, so make sure to provide all the required keys
exports.update = function(table, data, callback) {
	//50 q's
	const q = ['?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?'];
	const query = 'insert into ' + table + ' (' + Object.keys(data).toString() + ') values ('+ q.splice(0, Object.keys(data).length).toString() +')';
	const params = [];

	for(const key in data) {
		if(data[key] === undefined) data[key] = null;
		params.push(data[key]);
	}

	cassandraDbInstance.execute(query, params, {
		prepare: true
	}, function(err, result) {
		if(callback) callback(err, result);
	});
};

exports.getAsync = function(table, fields, data) {
	return new Promise((resolve, reject) => {
		exports.get(table, fields, data, (err, res) => {
			if(err) return reject(err);
			resolve(res);
		});
	});
};

exports.getFromQueryAsync = function(query, params) {
	return new Promise((resolve, reject) => {
		cassandraDbInstance.execute(query, params, {
			prepare: true,fetchSize:10000
		}, function(err, result) {
			if(err) return reject(err);
			resolve(result.rows);
		});
	});
};

exports.get = function(table, fields, data, callback) {
	if(fields === null || fields === undefined) fields = '*';
	//50 q's
	const q = ['?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?'];
	let query = 'select ' + fields.toString() + ' from ' + table;
	let where = '';
	const params = [];
	if(data) {
		query += ' where ';

		for(const key in data) {
			where += (key + ' = ? and ');
			params.push(data[key]);
		}
		where = where.substr(0, where.length-5);
	}
    const options = { prepare : true , fetchSize : 1000 };
    let gpsData = [];
   cassandraDbInstance.eachRow(query+where+' allow filtering', params, options, function (n, row) {
        gpsData.push(row);
    }, function(err, result) {
		if(err) return callback(err);
            if (result.nextPage) {
                result.nextPage();
            }else{
                callback(err, gpsData);
            }
	 });
};

exports.deleteAsync = function(table, data) {
	return new Promise((resolve, reject) => {
		exports.delete(table, data, (err, res) => {
			if(err) return reject(err);
			resolve(res);
		});
	});
};

exports.delete = function(table, data, callback) {
	//50 q's
	const q = ['?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?','?'];
	const query = 'delete from ' + table + ' where ';
	let where = '';
	const params = [];
	for(const key in data) {
		where += (key + ' = ? and ');
		params.push(data[key]);
	}
	where = where.substr(0, where.length-5);

	// return callback();

	cassandraDbInstance.execute(query+where, params, {
		prepare: true
	}, function(err, result) {
		if(err) return callback(err);
		callback(err, result.rows);
	});
};