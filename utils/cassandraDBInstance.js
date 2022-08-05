/**
 * Created by bharath on 15/06/17.
 */
const config = require('../config');
const database = config.database;

let cassandraDbInstance;

if (!config.shouldConnectToDb) {
	cassandraDbInstance = {execute: require('sinon').spy()};
} else {
	console.log('connecting to cassandra:', database.nodes.toString());
	const cassandraDriver = require('cassandra-driver');
	cassandraDbInstance = new cassandraDriver.Client({
		contactPoints: database.nodes,
		keyspace: database.keyspace,
		localDataCenter: 'datacenter1'//todo change as for your name
	});
}

module.exports = cassandraDbInstance;
