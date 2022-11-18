var mongoose = require('mongoose');
const Promise = require('bluebird');
const config = require("../config");

module.exports.initializeDB = async function () {
    try {
        if(config.syncMongoDB && config.syncMongoDB.lms){
            global.lmsDB =  await dbSetup (config.syncMongoDB.lms);
            console.log(`Connected lmsDB: ${lmsDB.name}@${lmsDB.host}:${lmsDB.port}`);
            if(config.syncMongoDB.lms.name == 'Fleetronix'){
                global.lmsDBSyncService = require('../lmsDB/lmsServiceFleetronix');
            }

        }

        if(config.syncMongoDB && config.syncMongoDB.lmsUmb){
            global.lmsDBUmb =  await dbSetup (config.syncMongoDB.lmsUmb);
            console.log(`Connected lmsDBUmb: ${lmsDBUmb.name}@${lmsDBUmb.host}:${lmsDBUmb.port}`);
            global.lmsDBSyncService = require('../lmsDB/lmsService');
        }
    }
    catch (err){
        console.error('MongoDB connection error: ', err);
    }
};

async function dbSetup (mongoConf) {
    let Uri = "mongodb://";
    if (mongoConf.user) {
        Uri = Uri + mongoConf.user + ":" + mongoConf.password + "@"
    }
    Uri = Uri + mongoConf.host + ":" + mongoConf.port + "/" + mongoConf.db;
    let options = {
        useUnifiedTopology: true,
        //	useMongoClient: true,
        autoIndex: true,
        poolSize: 100,
        connectTimeoutMS:480000,
        socketTimeoutMS:300000,
        keepAlive: 300000,
        //bufferCommands:false,
       // bufferMaxEntries: 5,
        useNewUrlParser:true
    };
    if(mongoConf.slaveOk){
        options.db = {
            readPreference: 'secondary',
            slaveOk: mongoConf.slaveOk ? mongoConf.slaveOk : false
        };
        options.replSet =  {
            replicaSet: mongoConf.replicaSet ? mongoConf.replicaSet :  'rs0'
        }
    }
    mongoose.Promise = Promise;
    mongoose.set('useCreateIndex', true);
    return await mongoose.createConnection(Uri, options);
}
