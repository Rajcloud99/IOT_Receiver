let RegisteredVehicle = require('../lmsDB/vehicles');
let logOne = 357073295741991;
module.exports.insertdData = async function (data) {
    if (data && (logOne == data.device_id)) {
        console.log('ping from logOne', data);
    }
    const oSave = {
        ...data,
        location: {
            type: 'Point',
            coordinates: [data.lng, data.lat]
        },
        vendor_code: '00'
    };
    if (data.lng && data.lat) {
        await RegisteredVehicle.updateMany({device_imei: data.device_id}, {
            $set: {
                device_type: data.model_name,
                odometer: data.odo,
                gpsVendor: "Fleetronix",
                gpsData: oSave
            }
        });
    }
};

module.exports.insertdDataStatus = async function (data) {

    await RegisteredVehicle.updateMany({device_imei: data.device_id}, {
        $set: {
            device_type: data.model_name,
            gpsVendor: "Fleetronix",
            'gpsData.positioning_time': Date.now()
        }
    });

};
