const geolib = require('geolib');

function isPointInside(point, polygon) {
    if (point && polygon) {
        return geolib.isPointInPolygon(point, polygon);
    } else {
        return false;
    }
}

function isPointInCircle(point, center, radius) {
    if (point && center && radius) {
       // console.log(point,center,radius);
        return geolib.isPointWithinRadius(point, center, parseInt(radius));
    } else {
        return false;
    }
}

function getDistance(objStart, objEnd) {
    if (objStart.latitude && objStart.longitude && objEnd.latitude && objEnd.longitude) {
        return geolib.getDistance(objStart, objEnd);
    } else {
        return 0;
    }
}

module.exports.isPointInside = isPointInside;
module.exports.isPointInCircle = isPointInCircle;
module.exports.getDistance = getDistance;
