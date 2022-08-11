const dbConf = require('../utils/dbConf');

module.exports = {
    "host":"IP",
    "database": {
        nodes: dbConf.isDBLocal ? ['localhost'] : ["ip1,ip2"],
        fcmEnabled: !dbConf.isDBLocal,
        http_port:5006,
	    smsEnabled: !dbConf.isDBLocal,
	    emailEnabled : !dbConf.isDBLocal,
	    fcmServerKey: "AAAAlrzDX34545491bHXHfspC8qyT5fGHoiEC1B237Z8d_g0Dxob3Aqzjxc3PY3Ao9r96_DoHgLldQm8T2dsVy8Edk6eLirG6VDW4e4icxqrjLorSNDAH46SAfkdyrHnllEeGFTxbrzNFjRmKsD2aEnV",
	    keyspace: 'gps_ups',
	    table_gps_data: 'gps_data',
	    table_cities: 'cities',
	    table_device_inventory: 'device_inventory',
	    table_sim_info: 'gps_sim_info',
	    table_users: 'users',
	    table_vehicles: 'vehicles',
	    table_report_parking: 'report_parking',
	    table_report_acc: 'report_acc',
	    table_drives_and_stops: 'drives_and_stops',
	    table_aggregated_drives_and_stops: 'aggregated_drives_and_stops',
	    table_geozone: "geozones",
	    table_Alarm: "alarms",
	    table_notification: "notifications",
	    table_heartbeat: 'heartbeat_packet',
	    table_Trip: "trips",
	    table_gpsgaadi: "gpsgaadi",
	    table_report_status: 'report_status',
	    table_report_overspeed: 'report_overspeed',
	    table_mobile_device: 'mobile_device',
	    table_notification_pref: "notification_pref",
	    table_adas_refined: "adas_refined",
        table_adas_refined_new: "adas_refined_new",
	    table_adas_daily: "adas_daily",
	    table_adas_weekly: "adas_weekly",
	    table_adas_monthly: "adas_monthly",
        table_landmarks: 'landmarks',
		table_device_alerts: 'device_alerts',
        table_data_packets:'packet',
        table_debug : 'device_debug',
        table_report_boolean: 'report_boolean',
        table_is_geofence_event: 'is_geofence_event'
    },
    "alarms": {
        sos: 'Panic ',
        power_cut: 'Vehicle power cut',
        power_connect:'Vehicle power connect',
        anti_theft: 'Vehicle anti-theft and alarming',
        under_speed: 'Underspeed Alert',
        over_speed: 'Over Speed',
        fence_in: 'Enter geo fence',
        fence_out: 'Exit geo fence',
        accident: 'The vehicle suffers a sudden jerk or an accident.',
        low_internal_battery: 'Low Internal Battery Voltage',
        low_external_battery: 'Low External Battery Voltage',
        external_battery_removed: 'External Battery Removed',
        gps_antenna_ok: 'GPS Antenna Status is OK',
        gps_antenna_open: 'GPS Antenna Status is Open',
        gps_antenna_short: 'GPS Antenna Status is Short',
        gps_antenna_unknown: 'GPS Antenna Status is Unknown',
      	input_2_active: 'Input 2 Active',
		input_3_active: 'Input 3 Active',
		input_4_active: 'Input 4 Active',
		input_5_active: 'Input 5 Active',
		input_1_inactive: 'Input 1 Inactive',
		input_2_inactive: 'Input 2 Inactive',
		input_3_inactive: 'Input 3 Inactive',
		input_4_inactive: 'Input 4 Inactive',
		input_5_inactive: 'Input 5 Inactive',
		external_battery_connected: 'External Battery On',
		gps_signal_lost: 'Lose GPS Signal',
		gps_signal_recovered: 'GPS Signal Recovery',
		enter_sleep: 'Enter Sleep',
		exit_sleep: 'Exit Sleep',
		device_reboot: 'Device Reboot',
		heading_change: 'Heading Change',
        rfid:'Driver Tag Swiped',
		// distance_interval_tracking: 'Distance Interval Tracking',
		// reply_current: 'Reply Current (Passive)',
		// time_interval_tracking: 'Time Interval Tracking',
		tow: 'Tow',
		picture: 'Picture',
		stop_moving: 'Stop Moving',
		start_moving: 'Start Moving',
		jamming: 'GSM Jammed',
		temperature_high: 'Temperature High',
		temperature_low: 'Temperature Low',
		fuel_full: 'Fuel Full',
		fuel_empty: 'Fuel Empty',
		fuel_stolen: 'Fuel Stolen',
		armed: 'Armed',
		disarmed: 'Disarmed',
		no_jamming: 'GSM No Jamming',
		pressed_input_1_to_call: 'Press Input 1 (SOS) to Call',
		pressed_input_2_to_call: 'Press Input 2 to Call',
		pressed_input_3_to_call: 'Press Input 3 to Call',
		pressed_input_4_to_call: 'Press Input 4 to Call',
		pressed_input_5_to_call: 'Press Input 5 to Call',
		reject_incoming_call: 'Reject Incoming Call',
		get_location_by_call: 'Get Location by Call',
		auto_answer_incoming_call: 'Auto Answer Incoming Call',
		listen_in: 'Listen-in (Voice Monitoring)',
		fall: 'Fall',
		install: 'Install',
		drop_off: 'Drop Off',
		maintenance: 'Maintenance Notice',
        emergency:'Emergency Alert',
        tempering:'Device tempering',
        hb:'Harsh Braking',
        ha:'Rapid Acceleration',
        rt:'Harsh Cornering',
        tl:'Tilt',
        engine_on:'Engine On',
        engine_off:'Engine Off',
        bettery_reconnect:'Battery Reconnect',
        wire_disconnect:'Power Wire Disconnect'
    },
    "devices": [
        {
            "key": "tr02",
            "value": {
              "sms": {
                  "location": "WHERE,666666#"
                  }
                }
        },
        {
            "key": "tr06",
            "value": {
                "sms": {
                    "location": "DWXX,000000#",
                    "petrol_cut": "DYD,000000#",
                    "petrol_restore": "HFYD,000000#",
                    "param": "PARAM#",
                    "gprs_param": "GPRSSET#",
                    "restore_factory": "FACTORY#",
                    "reboot": "RESET#",
                    "vibration_alarm": "SENSOR,%20#",
                    "change_apn": "APN,%20#",
                    "change_dns": "SERVER,1,%20,0#",
                    "gprs_off": "GPRSON,0#",
                    "add_sos_number": "SOS,A,%20#",
                    "delete_sos_number": "SOS,D,%20#",
                    "set_center_number": "CENTER,A,%20#",
                    "delete_center_number": "CENTER,D#",
                    "set_time_interval": "TIMER,%20#",
                    "sensor_alarm_time": "DEFENSE,%20#",
                    "location_url": "URL#",
                    "overspeed_alarm": "SPEED,%20#"
                }
            }
        },
        {
            "key": "crx",
            "value": {
                "sms": {
                    "location": "DWXX,000000#",
                    "petrol_cut": "RELAY,1#",
                    "petrol_restore": "RELAY,0#",
                    "param": "PARAM#",
                    "gprs_param": "GPRSSET#",
                    "restore_factory": "FACTORY#",
                    "reboot": "RESET#",
                    "vibration_alarm": "SENSOR,%20#",
                    "change_apn": "APN,%20#",
                    "change_dns": "SERVER,1,%20,0#",
                    "gprs_off": "GPRSON,0#",
                    "add_sos_number": "SOS,A,%20#",
                    "delete_sos_number": "SOS,D,%20#",
                    "set_center_number": "CENTER,A,%20#",
                    "delete_center_number": "CENTER,D#",
                    "set_time_interval": "TIMER,%20#",
                    "sensor_alarm_time": "DEFENSE,%20#",
                    "location_url": "URL#",
                    "overspeed_alarm": "SPEED,%20#"
                }
            }
        },
        {
            "key": "vt2",
            "value": {
                "sms": {
                    "location": "WHERE#",
                    "petrol_cut": "DYD#",
                    "petrol_restore": "HFYD#",
                    "param": "PARAM#",
                    "gprs_param": "GPRSSET#",
                    "restore_factory": "FACTORY#",
                    "reboot": "RESET#",
                    "change_apn": "APN,%20#",
                    "change_dns": "SERVER,1,%20,0#",
                    "gprs_off": "GPRSON,0#",
                    "add_sos_number": "SOS,A,%20#",
                    "delete_sos_number": "SOS,D,%20#",
                    "set_center_number": "CENTER,A,%20#",
                    "delete_center_number": "CENTER,D#",
                    "set_time_interval": "TIMER,%20#",
                    "location_url": "URL#",
                    "version": "VERSION#",
                    "set_adaptive_timezone": "ASETGMT,%20#",
                    "get_adaptive_timezone": "ASETGMT#",
                    "set_timezone": "GMT,%20#",
                    "get_timezone": "GMT#",
                    "vt2_set_heartbeat_interval": "HBT,%20#",
                    "get_heartbeat_interval": "HBT#",
                    "set_geofence_alarm": "FENCE,%20#",
                    "get_geofence_alarm": "FENCE#",
                    "restore_default_password": "RECOVER#",
                    "change_password": "PASSWORD,%20#",
                    "set_sleep_interval": "SENDS,%20#",
                    "get_sleep_interval": "SENDS#",
                    "set_vibration_alarm": "SENSOR,%20#",
                    "get_vibration_alarm": "SENSOR#",
                    "set_theft_alarm": "STALM,%20#",
                    "get_theft_alarm": "STALM#",
                    "vt2_vibration_alarm": "SENALM,%20#",
                    "get_vibration_params": "SENALM#",
                    "set_arm_disarm": "ACCALM,%20#",
                    "set_power_alarm": "POWERALM,%20#",
                    "set_battery_alarm": "BATALM,%20#",
                    "set_moving_alarm": "MOVING,%20#",
                    "vt2_overspeed_alarm": "SPEED,%20#",
                    "set_static_drift": "SF,%20#",
                    "vt2_set_heading_change": "ANGLEREP,%20#",
                    "get_iccid": "ICCID#"
                }
            }
        },
        {
            "key": "tr06n",
            "value": {
                "sms": {
                    "location": "DWXX,000000#",
                    "petrol_cut": "DYD,000000#",
                    "petrol_restore": "HFYD,000000#",
                    "param": "PARAM#",
                    "gprs_param": "GPRSSET#",
                    "restore_factory": "FACTORY#",
                    "reboot": "RESET#",
                    "vibration_alarm": "SENSOR,%20#",
                    "change_apn": "APN,%20#",
                    "change_dns": "SERVER,1,%20,0#",
                    "gprs_off": "GPRSON,0#",
                    "add_sos_number": "SOS,A,%20#",
                    "delete_sos_number": "SOS,D,%20#",
                    "set_center_number": "CENTER,A,%20#",
                    "delete_center_number": "CENTER,D#",
                    "set_time_interval": "TIMER,%20#",
                    "sensor_alarm_time": "DEFENSE,%20#",
                    "location_url": "URL#",
                    "overspeed_alarm": "SPEED,%20#"
                }
            }
        },
        {
            "key": "tr06f",
            "value": {
                "sms": {
                    "location": "DWXX,000000#",
                    "petrol_cut": "DYD,000000#",
                    "petrol_restore": "HFYD,000000#",
                    "param": "PARAM#",
                    "gprs_param": "GPRSSET#",
                    "restore_factory": "FACTORY#",
                    "reboot": "RESET#",
                    "vibration_alarm": "SENSOR,%20#",
                    "change_apn": "APN,%20#",
                    "change_dns": "SERVER,1,%20,0#",
                    "gprs_off": "GPRSON,0#",
                    "add_sos_number": "SOS,A,%20#",
                    "delete_sos_number": "SOS,D,%20#",
                    "set_center_number": "CENTER,A,%20#",
                    "delete_center_number": "CENTER,D#",
                    "set_time_interval": "TIMER,%20#",
                    "sensor_alarm_time": "DEFENSE,%20#",
                    "location_url": "URL#",
                    "overspeed_alarm": "SPEED,%20#"
                }
            }
        },
     	{
            "key": "tk103",
            "value": {
                "sms": {
                    "set_feedback" : {
                        "sms": "AR00",
                        "code": "BS08"
                    },
                    "location" : {
                        "sms": "AP00",
                        "code": "BP04"
                    },
                    "set_speed_limit": {
                        "sms": "AP12%20",
                        "code": "BP12"
                    },
                    "set_circuit": {
                        "sms": "AV01%20",
                        "code": "BV00"
                    },
                    "set_oil": {
                        "sms": "AV00%20",
                        "code": "BV00"
                    },
                    "restart": {
                        "sms": "AT00",
                        "code": "BT00"
                    },
                    "set_acc_open": {
                        "sms": "AR05%20",
                        "code": "BR05"
                    },
                    "set_acc_close": {
                        "sms": "AR06%20",
                        "code": "BR06"
                    },
                    "tk103_set_geofence": {
                        "sms": "AX05%20",
                        "code": "BU00"
                    }
                }
            }
        },
        {
            "key": "gt300",
            "value": {
                "sms": {
                    "location": "WHERE#",
                    "petrol_cut": "RELAY,1#",
                    "petrol_restore": "RELAY,0#",
                    "param": "PARAM#",
                    "gprs_param": "GPRSSET#",
                    "restore_factory": "FACTORY#",
                    "reboot": "RESET#",
                    "vibration_alarm": "SENSOR,%20#",
                    "change_apn": "APN,%20#",
                    "change_dns": "SERVER,1,%20,0#",
                    "gprs_off": "GPRSON,0#",
                    "add_sos_number": "SOS,A,%20#",
                    "delete_sos_number": "SOS,D,%20#",
                    "set_center_number": "CENTER,A,%20#",
                    "delete_center_number": "CENTER,D#",
                    "set_time_interval": "TIMER,%20#",
                    "sensor_alarm_time": "DEFENSE,%20#",
                    "location_url": "URL#",
                    "overspeed_alarm": "SPEED,%20#"
                }
            }
        },
        {
            "key": "ais140",
            "value": {
                "sms": {
                    "set_feedback" : {
                        "sms": "AR00",
                        "code": "BS08"
                    },
                    "location" : {
                        "sms": "AP00",
                        "code": "BP04"
                    },
                    "set_speed_limit": {
                        "sms": "AP12%20",
                        "code": "BP12"
                    },
                    "set_circuit": {
                        "sms": "AV00%20",
                        "code": "BV00"
                    },
                    "set_oil": {
                        "sms": "AV01%20",
                        "code": "BV00"
                    },
                    "restart": {
                        "sms": "AT00",
                        "code": "BT00"
                    },
                    "set_acc_open": {
                        "sms": "AR05%20",
                        "code": "BR05"
                    },
                    "set_acc_close": {
                        "sms": "AR06%20",
                        "code": "BR06"
                    },
                    "tk103_set_geofence": {
                        "sms": "AX05%20",
                        "code": "BU00"
                    }
                }
            }
        },
        {
            "key": "ais140copy",
            "value": {
                "sms": {
                }
            }
        },
        {
            "key": "crxv5",
            "value": {
                "sms": {
                    "location": "DWXX,000000#",
                    "petrol_cut": "RELAY,1#",
                    "petrol_restore": "RELAY,0#",
                    "param": "PARAM#",
                    "gprs_param": "GPRSSET#",
                    "restore_factory": "FACTORY#",
                    "reboot": "RESET#",
                    "vibration_alarm": "SENSOR,%20#",
                    "change_apn": "APN,%20#",
                    "change_dns": "SERVER,1,%20,0#",
                    "gprs_off": "GPRSON,0#",
                    "add_sos_number": "SOS,A,%20#",
                    "delete_sos_number": "SOS,D,%20#",
                    "set_center_number": "CENTER,A,%20#",
                    "delete_center_number": "CENTER,D#",
                    "set_time_interval": "TIMER,%20#",
                    "sensor_alarm_time": "DEFENSE,%20#",
                    "location_url": "URL#",
                    "overspeed_alarm": "SPEED,%20#"
                }
            }
        },
        {
            "key": "et300",
            "value": {
                "sms": {
                    "location": "DWXX,000000#",
                    "petrol_cut": "RELAY,1#",
                    "petrol_restore": "RELAY,0#",
                    "param": "PARAM#",
                    "gprs_param": "GPRSSET#",
                    "restore_factory": "FACTORY#",
                    "reboot": "RESET#",
                    "vibration_alarm": "SENSOR,%20#",
                    "change_apn": "APN,%20#",
                    "change_dns": "SERVER,1,%20,0#",
                    "gprs_off": "GPRSON,0#",
                    "add_sos_number": "SOS,A,%20#",
                    "delete_sos_number": "SOS,D,%20#",
                    "set_center_number": "CENTER,A,%20#",
                    "delete_center_number": "CENTER,D#",
                    "set_time_interval": "TIMER,%20#",
                    "sensor_alarm_time": "DEFENSE,%20#",
                    "location_url": "URL#",
                    "overspeed_alarm": "SPEED,%20#"
                }
            }
        },
        {
            "key": "jv200",
            "value": {
                "sms": {
                    "location": "DWXX,000000#",
                    "petrol_cut": "RELAY,1#",
                    "petrol_restore": "RELAY,0#",
                    "param": "PARAM#",
                    "gprs_param": "GPRSSET#",
                    "restore_factory": "FACTORY#",
                    "reboot": "RESET#",
                    "vibration_alarm": "SENSOR,%20#",
                    "change_apn": "APN,%20#",
                    "change_dns": "SERVER,1,%20,0#",
                    "gprs_off": "GPRSON,0#",
                    "add_sos_number": "SOS,A,%20#",
                    "delete_sos_number": "SOS,D,%20#",
                    "set_center_number": "CENTER,A,%20#",
                    "delete_center_number": "CENTER,D#",
                    "set_time_interval": "TIMER,%20#",
                    "sensor_alarm_time": "DEFENSE,%20#",
                    "location_url": "URL#",
                    "overspeed_alarm": "SPEED,%20#"
                }
            }
        },
        {
            "key": "atlanta",//PT100
            "value": {
                "sms": {
                    "location": "DWXX,000000#",
                    "petrol_cut": "RELAY,1#",
                    "petrol_restore": "RELAY,0#",
                    "param": "PARAM#",
                    "gprs_param": "GPRSSET#",
                    "restore_factory": "FACTORY#",
                    "reboot": "RESET#",
                    "vibration_alarm": "SENSOR,%20#",
                    "change_apn": "APN,%20#",
                    "change_dns": "SERVER,1,%20,0#",
                    "gprs_off": "GPRSON,0#",
                    "add_sos_number": "SOS,A,%20#",
                    "delete_sos_number": "SOS,D,%20#",
                    "set_center_number": "CENTER,A,%20#",
                    "delete_center_number": "CENTER,D#",
                    "set_time_interval": "TIMER,%20#",
                    "sensor_alarm_time": "DEFENSE,%20#",
                    "location_url": "URL#",
                    "overspeed_alarm": "SPEED,%20#"
                }
            }
        }
    ],
    "exception":{
    },
    "cronJobs" :{
        "dailyKM" :{
            "time" : '00 00 03 * * *'
        }
    },
    "notification":{}
};
