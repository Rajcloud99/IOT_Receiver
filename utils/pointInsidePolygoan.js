var pointInPolygon = require('point-in-polygon');

function isPointInPolygon(point, polygon) {
    let aPolygon = [],aPoint=[];
    if(polygon && polygon.length && polygon[0].latitude &&  polygon[0].longitude){
        for(var p=0;p<polygon.length;p++){
            aPolygon.push([polygon[p].latitude,polygon[p].longitude])
        }
    }
    if(point && point.latitude && point.longitude){
        aPoint = [point.latitude,point.longitude];
    }
    if (aPoint.length && aPolygon.length>2) {
        return pointInPolygon(aPoint, aPolygon);
    } else {
        return false;
    }
}

module.exports.isPointInPolygon = isPointInPolygon;
