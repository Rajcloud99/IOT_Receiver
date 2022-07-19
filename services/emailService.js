const emailUtil = require('../utils/emailUtils');
const alarms =require('../config').alarms;
const tbs = require('../services/telegramBotService');

module.exports.sendAlertMails = function(oAlarm,oSettings){
    if(oAlarm) {
        let addr = "NA";
        if(oAlarm.location && oAlarm.location.address){
            addr = oAlarm.location.address;
        }
        mailOptions = {
            to: ['kamal.mewada.nitt@gmail.com'],
            from: 'Umbrella [System Generated] <kamal.mewada@umbrellaprotectionsystems.com',
            subject: oAlarm.reg_no + " "+ alarms[oAlarm.code] + " Alert", // Subject line
            text: "Dear Customer, \n Please check alert on our portal.\n " +
                "Alert : "+ alarms[oAlarm.code] + " \n " +
                "Vehicle :"+ oAlarm.reg_no + " \n " +
                "Driver :"+ oAlarm.driver+ " \n " +
                "Time : "+ new Date(oAlarm.datetime).toLocaleString() + " \n "+
                "Address : "+ addr + " \n "+
                "Value : "+ oAlarm.extra + " \n "+
                "To know more details, please login to your account with your username and password.\n" +
                "Product Link : http://trucku.in \n Web Link : http://gpsgaadi.com"+ " \n \n"+
                "Regards \n Team Umbrella"
        };
        tbs.sendMessage(mailOptions.text);
        emailUtil.sendMailFromZoho(mailOptions);
    }
};

let oAlarm = {
    reg_no:'HR12345',
    code:'over_speed',
    datetime:new Date(),
    location:{address:"Delhi , IN"}
};
//module.exports.sendAlertMails(oAlarm);




