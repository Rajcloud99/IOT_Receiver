var mongoose = require ("mongoose");

var registeredVehicleSchema = new mongoose.Schema ({
        "clientId": {
            type: String,
            required: true,
        },
        "device_imei": Number,
        "device_type":String,
        "odometer":Number,
        "vehicle_reg_no": {
            type: String,
            required: true,
        },
        "gpsVendor": String,
        "gpsData": {
            vendor_name: String,
            vendor_code: String,
            acc_high: Boolean,
            acc_high_time:Date,
            address: String,
            device_id: Number,
            odo: Number,
            vehicle_no: [String],
            voltage: Number,
            speed: Number,
            positioning_time: Number,
            location_time: Number,
            lat: Number,
            lng: Number,
            io_state: String,
            datetime: Number,
            course: Number,
            location: {
                type: {
                    type: String,
                    default: 'Point'
                },
                coordinates: {
                    type: [Number],
                    default: [0, 0]
                }
            },
            f_lvl:Number
        }
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "last_modified_at"
        },
        strict: false
    }
);

registeredVehicleSchema.index ({'gpsData.location': '2dsphere'});

module.exports = lmsDB.model ("registeredvehicles", registeredVehicleSchema);
