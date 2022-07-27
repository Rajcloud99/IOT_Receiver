/**
 * @Author: kamal
 * @Date:   2017-11-11
 */

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const serverConfig = require('../config');
const winston = require('../utils/logger');

app.configureUtilities = function () {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: false
    }));
};

// Added to accept request from other ports.
app.configureHeaders = function () {
    app.all('*', function (req, res, next) {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Credentials', true);
        res.header('Access-Control-Max-Age', '86400');
        res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization');
        next();
    });
};

app.initialize = function () {
    app.configureUtilities();
    app.configureHeaders();
}();

const server = app.listen(serverConfig.database.http_port, function () {
    winston.info("http api listening on port : " + serverConfig.database.http_port);
});

module.exports = app;
