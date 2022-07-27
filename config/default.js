const dbConf = require('../utils/dbConf');

module.exports = {
    "database": {
        nodes: dbConf.isDBLocal ? ['localhost'] : ["101.53.139.123","15.206.33.235"],
        fcmEnabled: !dbConf.isDBLocal,
        http_port:5006,
	    smsEnabled: !dbConf.isDBLocal,
	    emailEnabled : !dbConf.isDBLocal,
	    fcmServerKey: "AAAAlrzDXf4:APA91bHXHfspC8qyT5fGHoiEC1B237Z8d_g0Dxob3Aqzjxc3PY3Ao9r96_DoHgLldQm8T2dsVy8Edk6eLirG6VDW4e4icxqrjLorSNDAH46SAfkdyrHnllEeGFTxbrzNFjRmKsD2aEnV",
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
            "key": "rp01",
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
            "key": "meitrack",
            "value": {
                "sms": {
                    "location": {
                        "sms": "Q%40,%30,A10",
                        "code": "A10"
                    },
                    "t1_set_heartbeat_interval": {
                        "sms": "S%40,%30,A11,%20",
                        "code": "A11"
                    },
                    "t1_set_time_interval": {
                        "sms": "V%40,%30,A12,%20",
                        "code": "A12"
                    },
                    "t1_set_heading_change": {
                        "sms": "X%40,%30,A13,%20",
                        "code": "A13"
                    },
                    "set_track_distance": {
                        "sms": "D%40,%30,A14,%20",
                        "code": "A14"
                    },
                    "set_parking_scheduled_tracking": {
                        "sms": "E%40,%30,A15,%20",
                        "code": "A15"
                    },
                    "enable_parking_scheduled_tracking": {
                        "sms": "F%40,%30,A16,%20",
                        "code": "A16"
                    },
                    "enable_rfid": {
                        "sms": "T%40,%30,A17,%20",
                        "code": "A17"
                    },
                    "shake_wake_up": {
                        "sms": "H%40,%30,A19,%20",
                        "code": "A19"
                    },
                    "set_gprs_param": {
                        "sms": "H%40,%30,A21,%20",
                        "code": "A21"
                    },
                    "t1_change_dns": {
                        "sms": "K%40,%30,A22,%20",
                        "code": "A22"
                    },
                    "set_standby_server": {
                        "sms": "S%40,%30,A23,%20",
                        "code": "A23"
                    },
                    "read_authorized_phones": {
                        "sms": "T%40,%30,A70",
                        "code": "A70"
                    },
                    "add_sos_number": {
                        "sms": "U%40,%30,A71,%20",
                        "code": "A71"
                    },
                    "add_listen_in_number": {
                        "sms": "V%40,%30,A72,%20",
                        "code": "A72"
                    },
                    "set_smart_sleep": {
                        "sms": "W%40,%30,A73,%20",
                        "code": "A73"
                    },
                    "delete_gprs_cache": {
                        "sms": "h%40,%30,AFF,%20",
                        "code": "AFF"
                    },
                    "add_geofence": {
                        "sms": "J%40,%30,B05,%20",
                        "code": "B05"
                    },
                    "delete_geofence": {
                        "sms": "J%40,%30,B06,%20",
                        "code": "B06"
                    },
                    "t1_overspeed_alarm": {
                        "sms": "P%40,%30,B07,%20",
                        "code": "B07"
                    },
                    "tow_alarm": {
                        "sms": "I%40,%30,B08,%20",
                        "code": "B08"
                    },
                    "anti_theft": {
                        "sms": "C%40,%30,B21,%20",
                        "code": "B21"
                    },
                    "turn_off_indicator": {
                        "sms": "J%40,%30,B31,%20",
                        "code": "B31"
                    },
                    "set_log_interval": {
                        "sms": "N%40,%30,B34,%20",
                        "code": "B34"
                    },
                    "set_sms_timezone": {
                        "sms": "O%40,%30,B35,%20",
                        "code": "B35"
                    },
                    "set_gprs_timezone": {
                        "sms": "P%40,%30,B36,%20",
                        "code": "B36"
                    },
                    "check_engine_first": {
                        "sms": "U%40,%30,B60,%20",
                        "code": "B60"
                    },
                    "set_sms_event_char": {
                        "sms": "R%40,%30,B91,%20",
                        "code": "B91"
                    },
                    "set_gprs_event_flag": {
                        "sms": "q%40,%30,B92,%20",
                        "code": "B92"
                    },
                    "read_gprs_event_flag": {
                        "sms": "V%40,%30,B93,%20",
                        "code": "B93"
                    },
                    "set_photo_event_flag": {
                        "sms": "A%40,%30,B96,%20",
                        "code": "B96"
                    },
                    "read_photo_event_flag": {
                        "sms": "C%40,%30,B97,%20",
                        "code": "B97"
                    },
                    "set_event_auth": {
                        "sms": "B%40,%30,B99,%20",
                        "code": "B99"
                    },
                    "output_control": {
                        "sms": "M%40,%30,C01,%20",
                        "code": "C01"
                    },
                    "notify_tracker_to_send_sms": {
                        "sms": "f%40,%30,C02,%20",
                        "code": "C02"
                    },
                    "set_gprs_event_transmission_mode": {
                        "sms": "f%40,%30,C03,%20",
                        "code": "C03"
                    },
                    "gprs_information_display": {
                        "sms": "m%40,%30,C13,%20",
                        "code": "C13"
                    },
                    "add_temp_sensor_number": {
                        "sms": "q%40,%30,C40,%20",
                        "code": "C40"
                    },
                    "delete_temp_sensor_number": {
                        "sms": "n%40,%30,C41,%20",
                        "code": "C41"
                    },
                    "view_temp_sensor_number": {
                        "sms": "m%40,%30,C42,%20",
                        "code": "C42"
                    },
                    "set_temp_alarm_value": {
                        "sms": "o%40,%30,C43,%20",
                        "code": "C43"
                    },
                    "read_temp_sensor_param": {
                        "sms": "r%40,%30,C44",
                        "code": "C44"
                    },
                    "check_temp_sensor_param": {
                        "sms": "i%40,%30,C46",
                        "code": "C46"
                    },
                    "set_fuel_param": {
                        "sms": "f%40,%30,C47,%20",
                        "code": "C47"
                    },
                    "read_fuel_param": {
                        "sms": "c%40,%30,C48,%20",
                        "code": "C48"
                    },
                    "set_fuel_theft_alarm": {
                        "sms": "c%40,%30,C49,%20",
                        "code": "C49"
                    },
                    "get_pic": {
                        "sms": "O%40,%30,D00,%20",
                        "code": "D00"
                    },
                    "get_pic_list": {
                        "sms": "A%40,%30,D01,%20",
                        "code": "D01"
                    },
                    "delete_pic": {
                        "sms": "E%40,%30,D02,%20",
                        "code": "D02"
                    },
                    "take_pic": {
                        "sms": "D%40,%30,D03,%20",
                        "code": "D03"
                    },
                    "add_rfid": {
                        "sms": "f%40,%30,D10,%20",
                        "code": "D10"
                    },
                    "add_rfid_batch": {
                        "sms": "e%40,%30,D11,%20",
                        "code": "D11"
                    },
                    "check_rfid_auth": {
                        "sms": "C%40,%30,D12,%20",
                        "code": "D12"
                    },
                    "read_authorized_rfid": {
                        "sms": "w%40,%30,D13,%20",
                        "code": "D13"
                    },
                    "delete_rfid": {
                        "sms": "Q%40,%30,D14,%20",
                        "code": "D14"
                    },
                    "delete_rfid_batch": {
                        "sms": "K%40,%30,D15,%20",
                        "code": "D15"
                    },
                    "check_rfid_checksum": {
                        "sms": "u%40,%30,D16",
                        "code": "D16"
                    },
                    "set_maintenance_mileage": {
                        "sms": "V%40,%30,D65,%20",
                        "code": "D65"
                    },
                    "set_maintenance_time": {
                        "sms": "V%40,%30,D66,%20",
                        "code": "D66"
                    },
                    "read_tracker_info": {
                        "sms": "W%40,%30,E91",
                        "code": "E91"
                    },
                    "restart_gsm": {
                        "sms": "j%40,%30,F01",
                        "code": "F01"
                    },
                    "restart_gps": {
                        "sms": "Z%40,%30,F02",
                        "code": "F02"
                    },
                    "set_mileage_runtime": {
                        "sms": "D%40,%30,F08,%20",
                        "code": "F08"
                    },
                    "delete_sms_gprs_cache": {
                        "sms": "E%40,%30,F09,%20",
                        "code": "F09"
                    },
                    "restore_factory": {
                        "sms": "E%40,%30,F11",
                        "code": "F11"
                    }
                }
            }
        },
        {
            "key": "mt90",
            "value": {
                "sms": {
                    "location": {
                        "sms": "Q%40,%30,A10",
                        "code": "A10"
                    },
                    "t1_set_heartbeat_interval": {
                        "sms": "S%40,%30,A11,%20",
                        "code": "A11"
                    },
                    "t1_set_time_interval": {
                        "sms": "V%40,%30,A12,%20",
                        "code": "A12"
                    },
                    "t1_set_heading_change": {
                        "sms": "X%40,%30,A13,%20",
                        "code": "A13"
                    },
                    "set_track_distance": {
                        "sms": "D%40,%30,A14,%20",
                        "code": "A14"
                    },
                    "set_parking_scheduled_tracking": {
                        "sms": "E%40,%30,A15,%20",
                        "code": "A15"
                    },
                    "enable_parking_scheduled_tracking": {
                        "sms": "F%40,%30,A16,%20",
                        "code": "A16"
                    },
                    "enable_rfid": {
                        "sms": "T%40,%30,A17,%20",
                        "code": "A17"
                    },
                    "shake_wake_up": {
                        "sms": "H%40,%30,A19,%20",
                        "code": "A19"
                    },
                    "set_gprs_param": {
                        "sms": "H%40,%30,A21,%20",
                        "code": "A21"
                    },
                    "t1_change_dns": {
                        "sms": "K%40,%30,A22,%20",
                        "code": "A22"
                    },
                    "set_standby_server": {
                        "sms": "S%40,%30,A23,%20",
                        "code": "A23"
                    },
                    "read_authorized_phones": {
                        "sms": "T%40,%30,A70",
                        "code": "A70"
                    },
                    "add_sos_number": {
                        "sms": "U%40,%30,A71,%20",
                        "code": "A71"
                    },
                    "add_listen_in_number": {
                        "sms": "V%40,%30,A72,%20",
                        "code": "A72"
                    },
                    "set_smart_sleep": {
                        "sms": "W%40,%30,A73,%20",
                        "code": "A73"
                    },
                    "delete_gprs_cache": {
                        "sms": "h%40,%30,AFF,%20",
                        "code": "AFF"
                    },
                    "add_geofence": {
                        "sms": "J%40,%30,B05,%20",
                        "code": "B05"
                    },
                    "delete_geofence": {
                        "sms": "J%40,%30,B06,%20",
                        "code": "B06"
                    },
                    "t1_overspeed_alarm": {
                        "sms": "P%40,%30,B07,%20",
                        "code": "B07"
                    },
                    "tow_alarm": {
                        "sms": "I%40,%30,B08,%20",
                        "code": "B08"
                    },
                    "anti_theft": {
                        "sms": "C%40,%30,B21,%20",
                        "code": "B21"
                    },
                    "turn_off_indicator": {
                        "sms": "J%40,%30,B31,%20",
                        "code": "B31"
                    },
                    "set_log_interval": {
                        "sms": "N%40,%30,B34,%20",
                        "code": "B34"
                    },
                    "set_sms_timezone": {
                        "sms": "O%40,%30,B35,%20",
                        "code": "B35"
                    },
                    "set_gprs_timezone": {
                        "sms": "P%40,%30,B36,%20",
                        "code": "B36"
                    },
                    "check_engine_first": {
                        "sms": "U%40,%30,B60,%20",
                        "code": "B60"
                    },
                    "set_sms_event_char": {
                        "sms": "R%40,%30,B91,%20",
                        "code": "B91"
                    },
                    "set_gprs_event_flag": {
                        "sms": "q%40,%30,B92,%20",
                        "code": "B92"
                    },
                    "read_gprs_event_flag": {
                        "sms": "V%40,%30,B93,%20",
                        "code": "B93"
                    },
                    "set_photo_event_flag": {
                        "sms": "A%40,%30,B96,%20",
                        "code": "B96"
                    },
                    "read_photo_event_flag": {
                        "sms": "C%40,%30,B97,%20",
                        "code": "B97"
                    },
                    "set_event_auth": {
                        "sms": "B%40,%30,B99,%20",
                        "code": "B99"
                    },
                    "output_control": {
                        "sms": "M%40,%30,C01,%20",
                        "code": "C01"
                    },
                    "notify_tracker_to_send_sms": {
                        "sms": "f%40,%30,C02,%20",
                        "code": "C02"
                    },
                    "set_gprs_event_transmission_mode": {
                        "sms": "f%40,%30,C03,%20",
                        "code": "C03"
                    },
                    "gprs_information_display": {
                        "sms": "m%40,%30,C13,%20",
                        "code": "C13"
                    },
                    "add_temp_sensor_number": {
                        "sms": "q%40,%30,C40,%20",
                        "code": "C40"
                    },
                    "delete_temp_sensor_number": {
                        "sms": "n%40,%30,C41,%20",
                        "code": "C41"
                    },
                    "view_temp_sensor_number": {
                        "sms": "m%40,%30,C42,%20",
                        "code": "C42"
                    },
                    "set_temp_alarm_value": {
                        "sms": "o%40,%30,C43,%20",
                        "code": "C43"
                    },
                    "read_temp_sensor_param": {
                        "sms": "r%40,%30,C44",
                        "code": "C44"
                    },
                    "check_temp_sensor_param": {
                        "sms": "i%40,%30,C46",
                        "code": "C46"
                    },
                    "set_fuel_param": {
                        "sms": "f%40,%30,C47,%20",
                        "code": "C47"
                    },
                    "read_fuel_param": {
                        "sms": "c%40,%30,C48,%20",
                        "code": "C48"
                    },
                    "set_fuel_theft_alarm": {
                        "sms": "c%40,%30,C49,%20",
                        "code": "C49"
                    },
                    "get_pic": {
                        "sms": "O%40,%30,D00,%20",
                        "code": "D00"
                    },
                    "get_pic_list": {
                        "sms": "A%40,%30,D01,%20",
                        "code": "D01"
                    },
                    "delete_pic": {
                        "sms": "E%40,%30,D02,%20",
                        "code": "D02"
                    },
                    "take_pic": {
                        "sms": "D%40,%30,D03,%20",
                        "code": "D03"
                    },
                    "add_rfid": {
                        "sms": "f%40,%30,D10,%20",
                        "code": "D10"
                    },
                    "add_rfid_batch": {
                        "sms": "e%40,%30,D11,%20",
                        "code": "D11"
                    },
                    "check_rfid_auth": {
                        "sms": "C%40,%30,D12,%20",
                        "code": "D12"
                    },
                    "read_authorized_rfid": {
                        "sms": "w%40,%30,D13,%20",
                        "code": "D13"
                    },
                    "delete_rfid": {
                        "sms": "Q%40,%30,D14,%20",
                        "code": "D14"
                    },
                    "delete_rfid_batch": {
                        "sms": "K%40,%30,D15,%20",
                        "code": "D15"
                    },
                    "check_rfid_checksum": {
                        "sms": "u%40,%30,D16",
                        "code": "D16"
                    },
                    "set_maintenance_mileage": {
                        "sms": "V%40,%30,D65,%20",
                        "code": "D65"
                    },
                    "set_maintenance_time": {
                        "sms": "V%40,%30,D66,%20",
                        "code": "D66"
                    },
                    "read_tracker_info": {
                        "sms": "W%40,%30,E91",
                        "code": "E91"
                    },
                    "restart_gsm": {
                        "sms": "j%40,%30,F01",
                        "code": "F01"
                    },
                    "restart_gps": {
                        "sms": "Z%40,%30,F02",
                        "code": "F02"
                    },
                    "set_mileage_runtime": {
                        "sms": "D%40,%30,F08,%20",
                        "code": "F08"
                    },
                    "delete_sms_gprs_cache": {
                        "sms": "E%40,%30,F09,%20",
                        "code": "F09"
                    },
                    "restore_factory": {
                        "sms": "E%40,%30,F11",
                        "code": "F11"
                    }
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
            "key": "cellocator",
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
            "key": "visiontek",
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
            "key": "avl500",
            "value": {
                "sms": {
                    "set_device_id": {
                        "sms": "SET|DID|%20"
                    },
                    "set_ip_addr": {
                        "sms": "SET|IP|%20"
                    },
                    "set_port": {
                        "sms": "SET|PORT|%20"
                    },
                    "set_apn": {
                        "sms": "SET|APN|%20"
                    },
                    "set_apun": {
                        "sms": "SET|APUN|%20"
                    },
                    "set_appw": {
                        "sms": "SET|APPW|%20"
                    },
                    "avl500_set_heartbeat_interval": {
                        "sms": "SET|SYNCI|M%20"
                    },
                    "get_heartbeat_interval": {
                        "sms": "GET|SYNCI",
                        "code": "SYNCI"
                    },
                    "set_mode_of_com": {
                        "sms": "SET|MC|%20"
                    },
                    "get_mode_of_com": {
                        "sms": "GET|MC",
                        "code": "MC"
                    },
                    "set_data_recording_freq": {
                        "sms": "SET|DRF|%20"
                    },
                    "set_location_time_list": {
                        "sms": "SET|LTL|%20"
                    },
                    "get_location_time_list": {
                        "sms": "GET|LTL",
                        "code": "LTL"
                    },
                    "set_dist_pos_interval": {
                        "sms": "SET|DBPI|%20"
                    },
                    "get_dist_pos_interval": {
                        "sms": "GET|DBPI",
                        "code": "DBPI"
                    },
                    "set_periodic_pos_interval": {
                        "sms": "GET|PPI"
                    },
                    "set_ppd_ignition": {
                        "sms": "SET|PPDWIGN|%20"
                    },
                    "get_ppd_ignition": {
                        "sms": "GET|PPDWIGN",
                        "code": "PPDWIGN"
                    },
                    "set_upload_size": {
                        "sms": "SET|UDS|%20"
                    },
                    "get_upload_size": {
                        "sms": "SET|UDS"
                    },
                    "get_summary": {
                        "sms": "GET|SLPD",
                        "code": "SLPD"
                    },
                    "set_center_number": {
                        "sms": "SET|CCN|%20"
                    },
                    "get_center_number": {
                        "sms": "GET|CCN",
                        "code": "CCN"
                    },
                    "set_auth_senders": {
                        "sms": "SET|ASL|%20"
                    },
                    "get_auth_senders": {
                        "sms": "GET|ASL",
                        "code": "ASL"
                    },
                    "get_imei": {
                        "sms": "GET|IMEI",
                        "code": "IMEI"
                    },
                    "set_sos_number": {
                        "sms": "SET|PNL|%20"
                    },
                    "get_sos_number": {
                        "sms": "GET|PNL",
                        "code": "PNL"
                    },
                    "set_sos_status": {
                        "sms": "SET|PNL /S|%20"
                    },
                    "get_sos_status": {
                        "sms": "GET|PNL /S",
                        "code": "PNL /S"
                    },
                    "set_dial1": {
                        "sms": "SET|DIAL1|%20"
                    },
                    "get_dial1": {
                        "sms": "GET|DIAL1",
                        "code": "DIAL1"
                    },
                    "set_dial2": {
                        "sms": "SET|DIAL2|%20"
                    },
                    "get_dial2": {
                        "sms": "GET|DIAL2",
                        "code": "DIAL2"
                    },
                    "set_dial1_status": {
                        "sms": "SET|DIAL1 /S|%20"
                    },
                    "get_dial1_status": {
                        "sms": "GET|DIAL1 /S",
                        "code": "DIAL1 /S"
                    },
                    "set_dial2_status": {
                        "sms": "SET|DIAL2 /S|%20"
                    },
                    "get_dial2_status": {
                        "sms": "GET|DIAL2 /S",
                        "code": "DIAL2 /S"
                    },
                    "set_incoming_num": {
                        "sms": "SET|INL|%20"
                    },
                    "get_incoming_num": {
                        "sms": "GET|INL",
                        "code": "INL"
                    },
                    "set_incoming_status": {
                        "sms": "SET|INL /S|%20"
                    },
                    "avl500_set_geofence_alarm": {
                        "sms": "SET|LAP|%20"
                    },
                    "get_geofence_alarm": {
                        "sms": "GET|LAP",
                        "code": "LAP"
                    },
                    "set_geofence_alarm_status": {
                        "sms": "SET|LAP /S|%20"
                    },
                    "set_alert_distance": {
                        "sms": "SET|AD|%20"
                    },
                    "get_alert_distance": {
                        "sms": "GET|AD",
                        "code": "AD"
                    },
                    "set_overspeed_alarm": {
                        "sms": "SET|OSI|%20"
                    },
                    "get_overspeed_alarm": {
                        "sms": "GET|OSI",
                        "code": "OSI"
                    },
                    "set_underspeed_alarm": {
                        "sms": "SET|BSI|%20"
                    },
                    "get_underspeed_alarm": {
                        "sms": "GET|BSI",
                        "code": "BSI"
                    },
                    "reset_tot_dist": {
                        "sms": "SET|TDTRST"
                    },
                    "get_tot_dist_status": {
                        "sms": "GET|TDT /S",
                        "code": "TDT /S"
                    },
                    "set_tot_dist_status": {
                        "sms": "SET|TDT /S|%20"
                    },
                    "set_vehicle_stop_interval": {
                        "sms": "SET|VSMI|%20"
                    },
                    "get_vehicle_stop_interval": {
                        "sms": "GET|VSMI",
                        "code": "VSMI"
                    },
                    "set_voice_channel": {
                        "sms": "SET|VC|%20"
                    },
                    "get_voice_channel": {
                        "sms": "GET|VC",
                        "code": "VC"
                    },
                    "set_audio_gain": {
                        "sms": "SET|AUDG|%20"
                    },
                    "get_audio_gain": {
                        "sms": "GET|AUDG",
                        "code": "AUDG"
                    },
                    "set_key5_message": {
                        "sms": "SET|KEY5|%20"
                    },
                    "get_key5_message": {
                        "sms": "GET|KEY5",
                        "code": "KEY5"
                    },
                    "set_key6_message": {
                        "sms": "SET|KEY6|%20"
                    },
                    "get_key6_message": {
                        "sms": "GET|KEY6",
                        "code": "KEY6"
                    },
                    "set_key7_message": {
                        "sms": "SET|KEY7|%20"
                    },
                    "get_key7_message": {
                        "sms": "GET|KEY7",
                        "code": "KEY7"
                    },
                    "set_key8_message": {
                        "sms": "SET|KEY8|%20"
                    },
                    "get_key8_message": {
                        "sms": "GET|KEY8",
                        "code": "KEY8"
                    },
                    "set_key9_message": {
                        "sms": "SET|KEY9|%20"
                    },
                    "get_key9_message": {
                        "sms": "GET|KEY9",
                        "code": "KEY9"
                    },
                    "set_key10_message": {
                        "sms": "SET|KEY10|%20"
                    },
                    "get_key10_message": {
                        "sms": "GET|KEY10",
                        "code": "KEY10"
                    },
                    "set_internal_battery_alert_threshold": {
                        "sms": "SET|IBT|%20"
                    },
                    "get_internal_battery_alert_threshold": {
                        "sms": "GET|IBT",
                        "code": "IBT"
                    },
                    "set_external_battery_alert_threshold": {
                        "sms": "SET|EBT|%20"
                    },
                    "get_external_battery_alert_threshold": {
                        "sms": "GET|EBT",
                        "code": "EBT"
                    },
                    "set_aux_port": {
                        "sms": "SET|AUXP|%20"
                    },
                    "set_csq_thereshold": {
                        "sms": "SET|CSQT|%20"
                    },
                    "get_csq_thereshold": {
                        "sms": "GET|CSQT",
                        "code": "CSQT"
                    },
                    "set_gps_thereshold": {
                        "sms": "SET|GPST|%20"
                    },
                    "get_gps_thereshold": {
                        "sms": "GET|GPST",
                        "code": "GPST"
                    },
                    "set_harsh_acceleration": {
                        "sms": "SET|HACLR|%20"
                    },
                    "get_harsh_acceleration": {
                        "sms": "GET|HACLR",
                        "code": "HACLR"
                    },
                    "set_sleep_mode_status": {
                        "sms": "SET|SLM|%20"
                    },
                    "get_sleep_mode_status": {
                        "sms": "GET|SLM",
                        "code": "SLM"
                    },
                    "set_digital_output_status": {
                        "sms": "SET|DIGO%20"
                    },
                    "get_digital_output_status": {
                        "sms": "GET|DIGO",
                        "code": "DIGO"
                    },
                    "version": {
                        "sms": "GET|VER",
                        "code": "VER"
                    },
                    "get_modem_version": {
                        "sms": "GET|MVER",
                        "code": "MVER"
                    },
                    "reset_modem": {
                        "sms": "SET|MDMRST|1"
                    },
                    "get_imsi": {
                        "sms": "GET|IMSI",
                        "code": "IMSI"
                    },
                    "reset_gps": {
                        "sms": "SET|GPSRST|1"
                    },
                    "reset_hardware": {
                        "sms": "SET|HRST|1"
                    },
                    "reset_software": {
                        "sms": "SET|SRST|1"
                    },
                    "power_off": {
                        "sms": "SET|PWROFF"
                    },
                    "set_debug_mode": {
                        "sms": "SET|DBG|%20"
                    },
                    "set_dist_with_ignition_status": {
                        "sms": "SET|DWIGN|%20"
                    },
                    "set_sos_device_status": {
                        "sms": "SET|SOS|%20"
                    },
                    "set_sms_status": {
                        "sms": "SET|SMS|%20"
                    },
                    "restore_factory": {
                        "sms": "SET|FCFG"
                    },
                    "set_error_msg_status": {
                        "sms": "SET|EWM /S|%20"
                    },
                    "modem_at_command": {
                        "sms": "GET|AT|%20",
                        "code": "AT"
                    },
                    "location": {
                        "sms": "GET|CPD",
                        "code": "CPD"
                    }
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
            "key": "ks199",
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
            "key": "m2c2025",
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
            "key": "gv200",
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
    "notification":{
        dispatchNotifEnable:true,
        //host:"trackyourcar.in",
        host:"gpsapi.umbrellaprotectionsystems.com",
        port:"3000",
        server_intercommunication_key:"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJrZXkiOiJncHNnYWFkaSIsInRpbWUiOjE1MjIwMTA0OTgxNjJ9.0kD2fPtK2cybSL1rU51_azToU_SEr_TcNXPOzKgUxyA"
    },
    "lms":{
        lmsService:true,
        host:"13.232.202.194",//"205.147.99.129",
        port:"3011",
        server_intercommunication_key:"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJrZXkiOiJncHNnYWFkaSIsInRpbWUiOjE1MjIwMTA0OTgxNjJ9.0kD2fPtK2cybSL1rU51_azToU_SEr_TcNXPOzKgUxyA"
    },
    "exception":{
        "castrol_dgfc":{
            overspeed:{
                limit:67,
                eachNewInstance:true,
                dur:5,
                unit:'min'
            },
            'ha':{
                limit:14,
                unit:'kmph/s'
            },
            'hb':{
                limit:14,
                unit:'kmph/s'
            },
            'cd':{//continuous driving
                limit:4,
                unit:'Hr',
                counter:1
            },
            'break':{
                break:1,
                breakUnit:'Hr',
                breakLimit:15,
                breakLU:'Min'
            },
            'nd':{//night Drive
                st:23,
                et:5,
                counter:1//hourly
            },
            md:{//max driver
              limit:14,
              unit:'Hr',
              includeBreak:true,
              counter:1
            }

        },
        "shell":{
            overspeed:{
                limit:67,
                eachNewInstance:false,
                dur:2,
                unit:'min'
            },
            'ha':{
                limit:14,
                unit:'kmph/s'
            },
            'hb':{
                limit:14,
                unit:'kmph/s'
            },
            'cd':{//continuous driving
                limit:4,
                unit:'Hr',
                counter:1
            },
            'break':{
                break:1,
                breakUnit:'Hr',
                breakLimit:15,
                breakLU:'Min'
            },
            'nd':{//night Drive
                st:22,
                et:6,
                counter:1//hourly
            },
            sb:{//seat belt
               limit:2
            },
            md:{//max driver
                limit:14,
                unit:'Hr',
                includeBreak:true,
                counter:1
            }
        },
        "GPSDEMO":{
            overspeed:{
                limit:60,
                eachNewInstance:true,
                dur:3,
                unit:'min'
            },
            'ha':{
                limit:14,
                unit:'kmph/s'
            },
            'hb':{
                limit:14,
                unit:'kmph/s'
            },
            'cd':{//continuous driving
                limit:3.5,
                unit:'Hr',
                counter:1
            },
            'break':{
                break:1,
                breakUnit:'Hr',
                breakLimit:15,
                breakLU:'Min'
            },
            'nd':{//night Drive
                st:23,
                et:5,
                counter:1//hourly
            },
            md:{//max driver
              limit:14,
              unit:'Hr',
              includeBreak:true,
              counter:1
            }

        }
    },
    "cronJobs" :{
        "dailyKM" :{
            "time" : '00 00 03 * * *'
        }
    }
};
