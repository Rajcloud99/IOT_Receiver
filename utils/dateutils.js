exports.getDDMMYYYY = function(date) {
    date = new Date(date);
    let dMonth, dDate;
    if (date.getMonth() < 9) {
        dMonth = "0" + (date.getMonth() + 1).toString();
    } else {
        dMonth = (date.getMonth() + 1).toString();
    }
    if (date.getDate() < 10) {
        dDate = "0" + date.getDate().toString();
    } else {
        dDate = date.getDate().toString();
    }
    return dDate + "-" + dMonth + "-" + date.getFullYear().toString();
};

exports.getDMYHMSMs = function (d) {
    d = new Date(d);
    return d.getFullYear() +"-"+
        ("00" + (d.getMonth() + 1)).slice(-2) + "-" +
        ("00" + d.getDate()).slice(-2) + " " +
        ("00" + d.getHours()).slice(-2) + ":" +
        ("00" + d.getMinutes()).slice(-2) + ":" +
        ("00" + d.getSeconds()).slice(-2) +"."+
        ("00" + d.getMilliseconds()).slice(-3);
};
exports.getGMTDMYHMSMs = function (d) {
    d = new Date(d);
    return d.getUTCFullYear() +"-"+
        ("00" + (d.getUTCMonth() + 1)).slice(-2) + "-" +
        ("00" + d.getUTCDate()).slice(-2) + " " +
        ("00" + d.getUTCHours()).slice(-2) + ":" +
        ("00" + d.getUTCMinutes()).slice(-2) + ":" +
        ("00" + d.getUTCSeconds()).slice(-2) +"."+
        ("00" + d.getUTCMilliseconds()).slice(-3);
};

exports.gethhmmaa = function(date) {
    date = new Date(date);
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
	return hours + ':' + minutes + ' ' + ampm;
};

exports.getFormattedDateTime = function(date) {
    date = new Date(date);
    return exports.getDDMMYYYY(date) + ' ' + exports.gethhmmaa(date);
};

exports.getMMDDYYYY = function() {
    const dateNow = new Date();
	let dMonth, dDate;
    if (dateNow.getMonth() < 9) {
        dMonth = "0" + (dateNow.getMonth() + 1).toString();
    } else {
        dMonth = (dateNow.getMonth() + 1).toString();
    }
    if (dateNow.getDate() < 10) {
        dDate = "0" + dateNow.getDate().toString();
    } else {
        dDate = dateNow.getDate().toString();
    }
    return dMonth + "-" + dDate + "-" + dateNow.getFullYear().toString();
};

exports.getYYYYMMDD = function(date) {
    date = new Date(date);
    let dMonth, dDate;
    if (date.getMonth() < 9) {
        dMonth = "0" + (date.getMonth() + 1).toString();
    } else {
        dMonth = (date.getMonth() + 1).toString();
    }
    if (date.getDate() < 10) {
        dDate = "0" + date.getDate().toString();
    } else {
        dDate = date.getDate().toString();
    }
    return date.getFullYear().toString() + dMonth + dDate;
};

exports.getYYYYMMDDHHMM = function(date) {
    date = new Date(date);
    let hours = date.getHours();
    hours = hours < 10 ? '0' + hours : hours;
    let minutes = date.getMinutes();
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return exports.getYYYYMMDD(date) + hours + minutes;
};

exports.getMorning = function(date) {
    date = date || new Date();
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
};

exports.getYesterdayMorning = function(date) {
    date = date || new Date();
    date.setDate(date.getDate() - 1);
    return exports.getMorning(date);
};

exports.getDurationFromSecs = function(dur) {
    let days = parseInt(dur / (60 * 60 * 24));
    let hours = parseInt((dur % (60 * 60 * 24)) / (60 * 60));
    let mins = parseInt((dur % (60 * 60)) / 60);
    days = days > 0 ? days + ' D ' : '';
    hours = hours > 0 ? hours + ' H ' : '';
    mins = mins > 0 ? mins + ' M ' : '';
    return days + hours + mins;
};

exports.getSecs = function(dt){
	return parseInt(new Date(dt).getTime()/1000);
};

exports.getDurationInSecs = function(start, end) {
    start = new Date(start);
    end = new Date(end);
    const dur = end.getTime() - start.getTime();
    return parseInt(dur / 1000);
};
exports.getDurationInMin = function(start, end) {
    start = new Date(start);
    end = new Date(end);
    const dur = end.getTime() - start.getTime();
    return parseInt(dur /60000);
};
