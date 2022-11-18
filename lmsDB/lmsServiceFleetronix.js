let RegisteredVehicle = require('../lmsDB/vehicles');
let logOne = 357073295741991;
module.exports.insertdData = async function (data) {
    if(data && (logOne == data.device_id)){
        console.log('ping from logOne',data);
    }
    console.log('ping from logOne',data.device_id);
    const oSave = {
        ...data,
        location: {
            type: 'Point',
            coordinates: [data.lng, data.lat]
        },
        vendor_code: '00'
    };
    if (data.lng && data.lat) {
        let oUpdate = await RegisteredVehicle.updateMany({device_imei: data.device_id}, {
                $set: {
                    device_type:data.model_name,
                    odometer: data.odo,
                    gpsVendor: "Fleetronix",
                    gpsData: oSave
                }
            });
        console.log('oUpdate on sync',oUpdate);
    }
};
