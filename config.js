/**
 * Updated by Kamal on 13-08-2020.
 */

process.env.NODE_CONFIG_DIR = __dirname + '/config';

const config = require('config');

config.servers = {
    tr06: options('tr06', 3000),
    crx: options('crx', 3001),
    tr02: options('tr02', 3002),
    vt2: options('vt2', 3004),
    tr06n: options('tr06n', 3005),
    vt3: options('vt2', 3006),
    tr06f: options('tr06f', 3007),
    fmb910: options('fmb910', 3008),
    tk103: options('tk103', 3010),
    gt300:options('gt300', 3012),
    ais140:options('ais140', 3015),
    vts03: options('vts03', 3019),
    crxv5: options('crxv5', 3021),
    et300: options('et300', 3022),
    atlanta: options('atlanta', 3025),
    atlanta_ais140: options('atlanta_ais140', 3026),
    atlanta_e101: options('atlanta_e101', 3027),
    atlanta_c100: options('atlanta_c100', 3028),
    fmb920: options('fmb920', 3029)
 };

function options(adapter, port) {
    return {
        port: port,
        device_adapter: '../adapters/' + adapter,
        type: adapter
    };
}

module.exports = config;
