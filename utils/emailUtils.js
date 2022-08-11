const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const winston = require('../utils/logger');
const config =require('../config');
const constants = require('./constants');

/***create reusable transporter object using the default SMTP transport ***/
const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: config.emailSettigs && config.emailSettigs.id || 'futuretrucksakh@gmail.com',
		pass: config.emailSettigs && config.emailSettigs.pass || 'truckhunter'
	}
});


const transporterZoho = nodemailer.createTransport({
	host: 'smtp.zoho.com',
	port: 465,
	secure: true, // use SSL
	auth: {
		user: config.emailSettigs && config.emailSettigs.id,
		pass: config.emailSettigs && config.emailSettigs.pass
	}
});


// var defaultMailOptions = {
// 	    from: 'GpsGaadi <futuretrucksakh@gmail.com>', // sender address
// 	    to: 'GpsGaadi <kamal@futuretrucks.in>', // list of receivers
// 	    subject: 'Greetings from GpsGaadi✔', // Subject line
// 	    text: 'Greetings fron GpsGaadi', // plaintext body
// 	    html: '<b>Hello Future Trucks✔</b>' // html body
// 	};

const sGreetings = '<b>Greetings from Future Ttrucks.<br>  <br> </b>';
const sSignatures = '<br> <br> <b> Best Regards <br> GpsGaadi <br> ' +
	'<a href=\"www.gpsgaadi.com\">www.gpsgaadi.com</a><br> Phone : +919891705019</b>';

function sendMail(oMailOptions,callback) {
	winston.info(config.database.emailEnabled,oMailOptions);
    if(config.database.emailEnabled){
	    transporter.sendMail(oMailOptions, function(error, info){

            if(error){
		        return winston.info(error);
		    }
		    if (callback){
				winston.info('Email sent: ' + (info && info.response));
		        callback(error,info);
            }
	    });
    }
}

function sendMailFromZoho(oMailOptions,callback) {
	//winston.info(config.database.emailEnabled,oMailOptions);
	if(config.database.emailEnabled && config.emailSettigs){
		transporterZoho.sendMail(oMailOptions, function(error, info){
			//winston.info('Email sent: ' + info && info.response);
			if(error){
				return winston.info(error);
			}
			if (callback){
				callback(error,info);
			}
		});
	}
}
/***oMailOptions would contain
 contentType = 'application/pdf' for pdf
 attachments = [ {
	       	filename : fileName ,
	       	path: fileAbsolutePath,
	       	contentType: contentType}]
 ***/
function sendMailWithAttachments(oMailOptions){
	if(oMailOptions.fileName){
	    const aAttachments = oMailOptions.attachments;
	    const mailOptions = {
		    to: oMailOptions.to,
		    from: oMailOptions.from,
		    subject: oMailOptions.subject,
		    text: oMailOptions.text,
		    html: oMailOptions.html,
		    attachments: oMailOptions.attachments
	    };
		sendMail(mailOptions);
	}
}

module.exports.mailToRepoOwners = function(logText, callback){
	const oMailOptions = {
		from: '<kamal.mewada@umbrellaprotectionsystems.com>', // sender address
		to: constants.repoOwnerEmails, // list of receivers
		subject: 'Gps receiver Test', // Subject line
		text: 'Texing now' // plaintext body
	};
	sendMail(oMailOptions,callback);
};

module.exports.mailToRepoOwnersByZoho = function(logText, callback){
	const oMailOptions = {
		from: 'Umbrella <kamal.mewada@umbrellaprotectionsystems.com>>', // sender address
		to: constants.repoOwnerEmails, // list of receivers
		subject: (config.isProductionServer ? 'Prod: ' : (config.isTestServer ? 'Test: ' : 'Develop: ')) + 'Gps receiver Issue', // Subject line
		text: logText // plaintext body
	};
	sendMailFromZoho(oMailOptions,callback);
};
function logEmailOptions(){
	winston.info("enable email :" + config.database.emailEnabled);
}

logEmailOptions();

module.exports.sendMail =  sendMail;
module.exports.sendMailFromZoho =  sendMailFromZoho;
module.exports.sendMailWithAttachments = sendMailWithAttachments;

//module.exports.mailToRepoOwnersByZoho();

