const database = require('../config').database;
const winston = require('../utils/logger');
const request = require('request');
winston.info("enable sms : ", database.smsEnabled);
const tbs = require('../services/telegramBotService');
const oSMS = {
	url: "https://control.msg91.com/api/sendhttp.php?",
	authKey: "90583AqVEKrH8612f7242P1",//kamal
	DLT_TE_ID:"1207163049878792754",//Kamal geofence alert
	//DLT_TE_ID:"1207164673278657049",//Vendor Payment DLT Template
	//DLT_TE_ID:"1207164673303371794",//Driver Payment DLT Template Hindi
	//sender: 'FTruck',
	sender: 'GPSGDI',
	//authKey:"113686ALrKhFZ0n5b49a25c",//isckon
	//DLT_TE_ID:"1207161744691520410",//ISKON
	//sender: 'ISKDWK',//ISKON
	mobile: 9535888738,
	route: 4,
	//unicode: 1,
	response: 'json',
	country: 91,
	message: 'Power alert for HR1234T45 at Khiata Patel Nagar West District New Delhi Delhi',
	encrypt:0

};
function generateOtp() {
	return Math.floor(Math.random() * 90000) + 10000;
}
module.exports.generateOtp = generateOtp;
function sendSMS(mobile, message,callback) {
	oSMS.mobile = mobile;
	oSMS.message = message;
	const smsUrl = oSMS.url + "authkey=" + oSMS.authKey + "&sender=" + oSMS.sender +"&DLT_TE_ID=" + oSMS.DLT_TE_ID + "&route=" + oSMS.route + "&unicode=" + oSMS.unicode + "&country=" + oSMS.country + "&response=" + oSMS.response + "&mobiles=" + oSMS.mobile + "&message=" + encodeURI(oSMS.message) + "&encrypt=" + oSMS.encrypt ;
	winston.info(smsUrl);
	if (database.smsEnabled) {
		request(smsUrl, function (error, response, body) {
			if(callback) callback(error,response);
			if (!error && (response.statusCode < 400)) {
				winston.info("SMS " + body, response.statusCode);
			} else {
				winston.error("failed SMS ", error);
			}
		});
	}else{
		console.log('SMS disabled');
	}
	return 1;
}
module.exports.sendSMS = sendSMS;
module.exports.verifyOTP = function (otp, savedOtp) {
	// winston.info('in verify otp service',otp,savedOtp);
	if (otp === savedOtp) {
		return {"verified": true, "message": "Your OTP is verified"};
	} else {
		return {"verified": false, "message": "Your OTP does not match. Please re-enter or request a new OTP."};
	}
};
module.exports.resendSMS = function (mobile, message) {
	return generateOtp();
};
let msg ='sos alert for HR55S1863 at delhi UMBRELLA PROTECTION SYSTEMS PVT LTD';
let vendorPaymentTemplate ='Payment released by Middle Mile Pro for Rs 3000  on date 16/03/2022 against vehicle HR55S1863  from Delhi  to Mumbai UMBRELLA PROTECTION SYSTEMS PVT LTD ';
let driverPaymentTemplate = 'Middle Mile Pro द्वारा आपके खाते में भुगतान हुआ ₹ 3000 दिनांक 16/03/2022 वाहन HR55S1863 from Delhi से Mumbai UMBRELLA PROTECTION SYSTEMS PVT LTD';
//sendSMS(9535888738,vendorPaymentTemplate);
//sendSMS(9535888738,driverPaymentTemplate);
//sendSMS(7291941405,msg);
//sendSMS(8447376061,msg);

//	Khiata, Patel Nagar West District, New Delhi, Delhi
//https://control.msg91.com/api/sendhttp.php?authkey=113686ALrKhFZ0n5b49a25c&sender=ISKDWK&DLT_TE_ID=1207161744691520410&mobiles=919535888738&route=4&unicode=1&message=Power_Cut%2Balert%2Bfor%2BHR123456%2Bat%2BDelhi%2BISKCON%2BDwarka%2BDelhi&encrypt=0&requestid=3164666a5944323133303035&sentTime=2021-04-06%2B10%3A51%3A30&userip=54.254.154.166
