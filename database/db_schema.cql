
CREATE KEYSPACE gps_ups WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '1'}  AND durable_writes = true;

CREATE TYPE gps_ups.alarm (
    name text,
    atype text,
    enabled smallint
);

CREATE TYPE gps_ups.cords (
    latitude double,
    longitude double
);

CREATE TYPE gps_ups.geofence (
    name text,
    addr text,
    lat double,
    lng double,
    sms bigint,
    email text,
    type text,
    entry tinyint,
    exit tinyint,
    enabled tinyint,
    datetime timestamp,
    created_at timestamp
);

CREATE TYPE gps_ups.geofence_status (
    datetime timestamp,
    lat double,
    lng double,
    course int,
    name text,
    category text,
    message text
);

CREATE TYPE gps_ups.landline_number (
    std_code int,
    phone_number bigint
);

CREATE TYPE gps_ups.location (
    lat double,
    lng double,
    speed int,
    course int,
    address text,
    datetime timestamp
);

CREATE TYPE gps_ups.schedule (
    start timestamp,
    end timestamp,
    msg text
);

CREATE TYPE gps_ups.sub_user (
    mobile bigint,
    type text,
    role text,
    name text,
    user_id text
);

CREATE TYPE gps_ups.tracking (
    start_time timestamp,
    end_time timestamp,
    lat double,
    lng double,
    course int,
    speed float,
    status text
);

CREATE TABLE gps_ups.adas_weekly (
    imei bigint,
    date int,
    distance int,
    dur_drive int,
    dur_idle int,
    dur_stop int,
    num_idle int,
    num_stops int,
    top_speed int,
    PRIMARY KEY (imei, date)
) WITH CLUSTERING ORDER BY (date ASC)
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.adas_monthly (
    imei bigint,
    date int,
    distance int,
    dur_drive int,
    dur_idle int,
    dur_stop int,
    num_idle int,
    num_stops int,
    top_speed int,
    PRIMARY KEY (imei, date)
) WITH CLUSTERING ORDER BY (date ASC)
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.report_user_config (
    user_id text PRIMARY KEY,
    biweekly boolean,
    daily_activity boolean,
    daily_hault boolean,
    daily_mileage boolean,
    daily_over_speed boolean,
    daily_track_sheet boolean,
    emails list<text>,
    monthly boolean,
    monthly_hault boolean,
    monthly_mileage boolean,
    weekly boolean,
    weekly_activity boolean,
    weekly_hault boolean,
    weekly_mileage boolean,
    weekly_overspeed boolean,
    yearly boolean
) WITH bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.features (
    user_id text,
    feature text,
    allowed_fields list<text>,
    permissions list<text>,
    shown_fields list<text>,
    PRIMARY KEY (user_id, feature)
) WITH CLUSTERING ORDER BY (feature ASC)
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.malfunction (
    imei bigint,
    user_id text,
    created_at timestamp,
    device_type text,
    last_modified timestamp,
    modified_by text,
    notice_date timestamp,
    reason text,
    reg_no text,
    remark text,
    PRIMARY KEY (imei, user_id, created_at)
) WITH CLUSTERING ORDER BY (user_id ASC, created_at ASC)
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.device_inventory (
    imei bigint PRIMARY KEY,
    ac_on boolean,
    acc_high boolean,
    acc_high_time timestamp,
    activation_time timestamp,
    address text,
    contact_no bigint,
    course int,
    created_at timestamp,
    device_type text,
    dist_d_2 int,
    dist_d_3 int,
    dist_d_4 int,
    dist_d_5 int,
    dist_d_6 int,
    dist_d_7 int,
    dist_today int,
    dist_yesterday int,
    driver text,
    driver_contact bigint,
    driver_name text,
    driver_name2 text,
    eapi text,
    expiry_time timestamp,
    f_lvl float,
    geofence_status frozen<geofence_status>,
    gsm_signal_str int,
    halt_detection_time timestamp,
    halt_location_time timestamp,
    hb_limit int,
    icon text,
    ip text,
    last_alert_time timestamp,
    last_alert_type text,
    last_modified timestamp,
    last_modified_by text,
    lat float,
    lng float,
    location_time timestamp,
    manufecturer text,
    name text,
    odo int,
    on_trip boolean,
    pooled tinyint,
    port int,
    positioning_time timestamp,
    power_supply boolean,
    power_supply_time timestamp,
    ra_limit int,
    reg_no text,
    remark text,
    rfid1 text,
    rfid2 text,
    sens_fl decimal,
    sim_no bigint,
    sim_provider text,
    sn text,
    speed int,
    status text,
    user_id text,
    user_role text
) WITH bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'bucket_high': '1.5', 'bucket_low': '0.5', 'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'enabled': 'true', 'max_threshold': '32', 'min_sstable_size': '50', 'min_threshold': '4', 'tombstone_compaction_interval': '86400', 'tombstone_threshold': '0.2', 'unchecked_tombstone_compaction': 'false'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';
CREATE INDEX device_inventory_port_idx ON gps_ups.device_inventory (port);
CREATE INDEX device_inventory_user_id_idx ON gps_ups.device_inventory (user_id);
CREATE INDEX device_inventory_status_idx ON gps_ups.device_inventory (status);
CREATE INDEX device_inventory_device_type ON gps_ups.device_inventory (device_type);
CREATE INDEX device_invemtory_location_time ON gps_ups.device_inventory (location_time);
CREATE INDEX device_inventory_reg_no_idx ON gps_ups.device_inventory (reg_no);

CREATE TABLE gps_ups.packet (
    device_id bigint,
    datetime timestamp,
    cmd text,
    ip text,
    model text,
    packet text,
    parts text,
    PRIMARY KEY (device_id, datetime)
) WITH CLUSTERING ORDER BY (datetime ASC)
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.alarm_schedule (
    user_id text,
    date timestamp,
    alm_created_at timestamp,
    schedules list<frozen<schedule>>,
    PRIMARY KEY (user_id, date)
) WITH CLUSTERING ORDER BY (date ASC)
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.restore_adas_refined (
    imei bigint PRIMARY KEY,
    done_till timestamp
) WITH bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.aggregated_drives_and_stops (
    imei bigint,
    drive boolean,
    start_time timestamp,
    course int,
    distance int,
    duration int,
    end_time timestamp,
    googleaddr boolean,
    idle boolean,
    start frozen<cords>,
    start_addr text,
    stop frozen<cords>,
    stop_addr text,
    top_speed int,
    PRIMARY KEY (imei, drive, start_time)
) WITH CLUSTERING ORDER BY (drive ASC, start_time ASC)
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.users (
    user_id text PRIMARY KEY,
    access boolean,
    addr_line_1 text,
    addr_line_2 text,
    address_proof text,
    address_proof_type text,
    alternate_contact_name text,
    alternate_contact_number bigint,
    alternate_landline frozen<landline_number>,
    alternate_mobile bigint,
    beat boolean,
    company_logo text,
    company_name text,
    created_at timestamp,
    email text,
    fax_number frozen<landline_number>,
    gps_view text,
    id_proof text,
    id_proof_type text,
    ip text,
    landline_num frozen<landline_number>,
    last_modified timestamp,
    lms_token text,
    lms_url text,
    mobile bigint,
    mobile_imeis list<text>,
    name text,
    office_address text,
    pan text,
    pan_card_proof text,
    password text,
    percent_profile int,
    profile_img text,
    role text,
    service_tax_proof text,
    status text,
    sub_users list<frozen<sub_user>>,
    tin_number text,
    tnc_accepted boolean,
    top_places list<text>,
    type text,
    user_token text,
    vehicle_groups list<text>
) WITH bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'bucket_high': '1.5', 'bucket_low': '0.5', 'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'enabled': 'true', 'max_threshold': '32', 'min_sstable_size': '50', 'min_threshold': '4', 'tombstone_compaction_interval': '86400', 'tombstone_threshold': '0.2', 'unchecked_tombstone_compaction': 'false'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';
CREATE INDEX index_ip ON gps_ups.users (ip);

CREATE TABLE gps_ups.adas_refined (
    imei bigint,
    drive boolean,
    start_time timestamp,
    distance int,
    duration int,
    end_time timestamp,
    idle_duration int,
    landmark text,
    ldist int,
    lmark frozen<cords>,
    start frozen<cords>,
    start_addr text,
    stop frozen<cords>,
    stop_addr text,
    top_speed int,
    PRIMARY KEY (imei, drive, start_time)
) WITH CLUSTERING ORDER BY (drive ASC, start_time ASC)
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.is_geofence_event (
    user_id text,
    created_at timestamp,
    is_inside boolean,
    location_buffer list<frozen<geofence_status>>,
    PRIMARY KEY (user_id, created_at)
) WITH CLUSTERING ORDER BY (created_at DESC)
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.landmarks (
    user_id text,
    created_at timestamp,
    address text,
    category text,
    location frozen<cords>,
    name text,
    PRIMARY KEY (user_id, created_at)
) WITH CLUSTERING ORDER BY (created_at ASC)
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.report_status (
    imei bigint,
    datetime timestamp,
    online boolean,
    PRIMARY KEY (imei, datetime)
) WITH CLUSTERING ORDER BY (datetime ASC)
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.tolls (
    toll_plaza_id int PRIMARY KEY,
    bus_rate_multi int,
    car_rate_single int,
    four_to_six_axle_single int,
    google_dump text,
    hcm_eme_single int,
    latitude float,
    lcv_rate_single int,
    longitude float,
    multi_axle_rate_single int,
    project_type text,
    route_name text,
    search_loc text,
    seven_or_more_axle_single int,
    toll_address text,
    toll_address_osm text,
    toll_name text
) WITH bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.gps_data (
    device_id bigint,
    datetime timestamp,
    cid text,
    course int,
    f_lvl float,
    fl int,
    gps_tracking boolean,
    ignition int,
    input_state text,
    inserted timestamp,
    lac text,
    latitude float,
    longitude float,
    mcc int,
    mileage int,
    mnc int,
    power_supply boolean,
    real_time boolean,
    satellites int,
    sb boolean,
    speed int,
    vendor text,
    PRIMARY KEY (device_id, datetime)
) WITH CLUSTERING ORDER BY (datetime ASC)
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.restore_table (
    table_name text PRIMARY KEY,
    done_till timestamp
) WITH bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.restore_gps_data (
    imei bigint PRIMARY KEY,
    done_till timestamp
) WITH bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.drives_and_stops (
    imei bigint,
    drive boolean,
    start_time timestamp,
    course int,
    distance int,
    duration int,
    end_time timestamp,
    start frozen<cords>,
    start_addr text,
    stop frozen<cords>,
    stop_addr text,
    top_speed int,
    PRIMARY KEY (imei, drive, start_time)
) WITH CLUSTERING ORDER BY (drive ASC, start_time ASC)
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.sim_info (
    sim_number bigint,
    owner_id bigint,
    date timestamp,
    network_provider text,
    PRIMARY KEY ((sim_number, owner_id))
) WITH bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.shared_locations (
    lid text,
    created_at timestamp,
    device_type text,
    emails list<text>,
    end_time timestamp,
    imei bigint,
    mobiles list<bigint>,
    start_time timestamp,
    user_id text,
    vehicle_no text,
    PRIMARY KEY (lid, created_at)
) WITH CLUSTERING ORDER BY (created_at DESC)
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.restore_adas (
    imei bigint PRIMARY KEY,
    done_till timestamp
) WITH bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.adas_daily (
    imei bigint,
    date int,
    distance int,
    dur_drive int,
    dur_idle int,
    dur_stop int,
    num_idle int,
    num_stops int,
    odo int,
    top_speed int,
    PRIMARY KEY (imei, date)
) WITH CLUSTERING ORDER BY (date ASC)
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';
CREATE INDEX "dateIndex" ON gps_ups.adas_daily (date);

CREATE TABLE gps_ups.device_alerts (
    imei bigint,
    datetime timestamp,
    code text,
    driver text,
    extra text,
    location frozen<location>,
    user_id text,
    PRIMARY KEY (imei, datetime)
) WITH CLUSTERING ORDER BY (datetime ASC)
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';
CREATE INDEX idx_code ON gps_ups.device_alerts (code);

CREATE TABLE gps_ups.notification_pref (
    device_id bigint,
    mobile_imei text,
    blind_area_enter boolean,
    blind_area_exit boolean,
    geofence boolean,
    halt boolean,
    last_modified timestamp,
    last_modified_by text,
    low_battery boolean,
    over_speed boolean,
    power_cut boolean,
    sim_card_change boolean,
    sos boolean,
    user_id text,
    PRIMARY KEY (device_id, mobile_imei)
) WITH CLUSTERING ORDER BY (mobile_imei ASC)
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.vehicles (
    vehicle_number text,
    owner_id bigint,
    driver_id bigint,
    associated_users list<bigint>,
    capacity text,
    code text,
    created_at timestamp,
    current_lat float,
    current_lng float,
    model text,
    permit text,
    pollution_cert text,
    rc_book text,
    type text,
    PRIMARY KEY ((vehicle_number, owner_id, driver_id))
) WITH bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.report_overspeed (
    imei bigint,
    start_time timestamp,
    distance int,
    duration int,
    end_time timestamp,
    speed int,
    start frozen<cords>,
    start_addr text,
    stop frozen<cords>,
    top_speed int,
    PRIMARY KEY (imei, start_time)
) WITH CLUSTERING ORDER BY (start_time ASC)
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.notifications (
    user_id text,
    datetime timestamp,
    driver text,
    emails list<text>,
    entry frozen<geofence_status>,
    exit frozen<geofence_status>,
    imei bigint,
    message text,
    mobiles list<bigint>,
    nid text,
    priority int,
    severity text,
    type text,
    vehicle_no text,
    PRIMARY KEY (user_id, datetime)
) WITH CLUSTERING ORDER BY (datetime DESC)
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';
CREATE INDEX notifications_type_idx ON gps_ups.notifications (type);
CREATE INDEX notifications_imei_idx ON gps_ups.notifications (imei);

CREATE TABLE gps_ups.report_acc (
    imei bigint,
    start_time timestamp,
    acc_high boolean,
    duration int,
    end_time timestamp,
    PRIMARY KEY (imei, start_time)
) WITH CLUSTERING ORDER BY (start_time ASC)
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'bucket_high': '1.5', 'bucket_low': '0.5', 'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'enabled': 'true', 'max_threshold': '32', 'min_sstable_size': '50', 'min_threshold': '4', 'tombstone_compaction_interval': '86400', 'tombstone_threshold': '0.2', 'unchecked_tombstone_compaction': 'false'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.mobile_device (
    imei text PRIMARY KEY,
    app_v text,
    fcm_key text,
    last_modified timestamp,
    model text,
    notification boolean,
    os_v text,
    user_id text
) WITH bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.cities (
    id uuid PRIMARY KEY,
    c text,
    d text,
    formatted_address text,
    lat float,
    lng float,
    p text,
    s text,
    sf text
) WITH bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.adas_refined_new (
    imei bigint,
    drive boolean,
    start_time timestamp,
    distance int,
    duration int,
    end_time timestamp,
    idle_duration int,
    lmark frozen<cords>,
    start frozen<cords>,
    start_addr text,
    stop frozen<cords>,
    stop_addr text,
    top_speed int,
    PRIMARY KEY (imei, drive, start_time)
) WITH CLUSTERING ORDER BY (drive ASC, start_time ASC)
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.untitled_table_45 (
    id bigint PRIMARY KEY
) WITH bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.report_boolean (
    imei bigint,
    type text,
    datetime timestamp,
    duration int,
    offline boolean,
    online boolean,
    value boolean,
    PRIMARY KEY (imei, type, datetime)
) WITH CLUSTERING ORDER BY (type ASC, datetime ASC)
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.report_beat (
    imei bigint,
    user_id text,
    start_time timestamp,
    beat_dist int,
    complete text,
    distance int,
    end_time timestamp,
    max_speed int,
    min_speed int,
    parent list<text>,
    reg_no text,
    remark text,
    section text,
    sse text,
    PRIMARY KEY (imei, user_id, start_time)
) WITH CLUSTERING ORDER BY (user_id ASC, start_time ASC)
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.api_access (
    user_id text PRIMARY KEY,
    api_key text,
    loc_by_regno int,
    password text
) WITH bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.routes (
    imei bigint,
    start_time timestamp,
    drive boolean,
    duration int,
    end_time timestamp,
    start frozen<cords>,
    stop frozen<cords>,
    PRIMARY KEY (imei, start_time)
) WITH CLUSTERING ORDER BY (start_time ASC)
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.report_parking (
    imei bigint,
    start_time timestamp,
    duration int,
    end_time timestamp,
    latitude float,
    longitude float,
    PRIMARY KEY (imei, start_time, duration)
) WITH CLUSTERING ORDER BY (start_time ASC, duration ASC)
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.heartbeat_packet (
    imei bigint,
    datetime timestamp,
    acc_high boolean,
    alarm_phone text,
    alarm_terminal text,
    charge_on boolean,
    defense_activated boolean,
    gps_tracking boolean,
    gsm_signal_str int,
    inserted timestamp,
    language text,
    oil_power_dc boolean,
    voltage int,
    PRIMARY KEY (imei, datetime)
) WITH CLUSTERING ORDER BY (datetime ASC)
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.geozones (
    gid text PRIMARY KEY,
    datetime timestamp,
    description text,
    geozone list<frozen<cords>>,
    last_modified timestamp,
    last_modified_by text,
    name text,
    ptype text,
    radius double,
    user_id text,
    zoom_level float
) WITH bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';
CREATE INDEX geozones_user_id_idx ON gps_ups.geozones (user_id);
CREATE INDEX geozones_name_idx ON gps_ups.geozones (name);

CREATE TABLE gps_ups.device_debug (
    device_id bigint,
    datetime timestamp,
    PRIMARY KEY (device_id, datetime)
) WITH CLUSTERING ORDER BY (datetime ASC)
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';

CREATE TABLE gps_ups.alarms (
    user_id text,
    created_at timestamp,
    aid text,
    atype text,
    category text,
    created_by text,
    custom_schedules list<frozen<schedule>>,
    description text,
    dest_id text,
    driver_name text,
    emails list<text>,
    enabled int,
    end_time timestamp,
    entry smallint,
    entry_msg text,
    exit smallint,
    exit_msg text,
    geozone list<frozen<cords>>,
    gid text,
    halt_duration int,
    imei bigint,
    in_status list<frozen<geofence_status>>,
    "isInside" boolean,
    is_inside boolean,
    last_location_time timestamp,
    last_modified timestamp,
    last_received_time timestamp,
    loc text,
    location_buffer list<frozen<geofence_status>>,
    milestone text,
    mobiles list<bigint>,
    name text,
    notif_created_at timestamp,
    notif_id text,
    out_status list<frozen<geofence_status>>,
    over_speed float,
    ptype text,
    public_link text,
    radius int,
    schedules list<frozen<schedule>>,
    start_time timestamp,
    status text,
    status_name text,
    trip_id text,
    type text,
    vehicle_no text,
    PRIMARY KEY (user_id, created_at)
) WITH CLUSTERING ORDER BY (created_at DESC)
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';
CREATE INDEX alarms_atype_idx ON gps_ups.alarms (atype);
CREATE INDEX alarms_aid_idx ON gps_ups.alarms (aid);
CREATE INDEX alarms_is_inside_idx ON gps_ups.alarms (is_inside);
CREATE INDEX alarms_imei_idx ON gps_ups.alarms (imei);
CREATE INDEX alarms_enabled_idx ON gps_ups.alarms (enabled);

CREATE TABLE gps_ups.gpsgaadi (
    user_id text,
    created_at timestamp,
    activation_time timestamp,
    branch text,
    contact_no bigint,
    customer text,
    device_type text,
    driver_contact bigint,
    driver_mobile bigint,
    driver_name text,
    estimated_dist int,
    expiry_time timestamp,
    icon text,
    imei bigint,
    ip text,
    last_modified timestamp,
    last_modified_by text,
    manufecturer text,
    name text,
    owner_group text,
    ownership text,
    reg_no text,
    remark text,
    remark2 text,
    remark3 text,
    route text,
    sim_no bigint,
    sim_provider text,
    sn text,
    sos_nos list<bigint>,
    status text,
    trip_end_time timestamp,
    trip_no int,
    trip_start_time timestamp,
    trip_status text,
    vehicle_group text,
    vehicle_status text,
    vehicle_type text,
    PRIMARY KEY (user_id, created_at)
) WITH CLUSTERING ORDER BY (created_at ASC)
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';
CREATE INDEX gpsgaadi_imei_idx ON gps_ups.gpsgaadi (imei);
CREATE INDEX gpsgaadi_reg_no_idx ON gps_ups.gpsgaadi (reg_no);

CREATE TABLE gps_ups.trips (
    trip_id text PRIMARY KEY,
    alarms list<frozen<alarm>>,
    branch text,
    consignee text,
    consignor text,
    created_at timestamp,
    created_by text,
    customer text,
    destination text,
    driver text,
    driver_no bigint,
    enabled tinyint,
    end_time timestamp,
    est_dist int,
    etoa timestamp,
    extrip_no text,
    forworder text,
    geofence_events list<frozen<geofence>>,
    geozones list<frozen<geofence>>,
    gps_status text,
    imei bigint,
    journey frozen<tracking>,
    last_modified_at timestamp,
    last_tracking frozen<tracking>,
    loading frozen<tracking>,
    manager text,
    owner_group text,
    remark1 text,
    remark2 text,
    remark3 text,
    route text,
    source text,
    start_time timestamp,
    status text,
    trip_date text,
    trip_no text,
    unloading frozen<tracking>,
    user_id text,
    vehicle_no text
) WITH bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'bucket_high': '1.5', 'bucket_low': '0.5', 'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'enabled': 'true', 'max_threshold': '32', 'min_sstable_size': '50', 'min_threshold': '4', 'tombstone_compaction_interval': '86400', 'tombstone_threshold': '0.2', 'unchecked_tombstone_compaction': 'false'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';
CREATE INDEX idx_trips_enabled ON gps_ups.trips (enabled);
CREATE INDEX idx_trips_imei ON gps_ups.trips (imei);
CREATE INDEX trips_user_id_idx ON gps_ups.trips (user_id);
CREATE INDEX idx_trips_status ON gps_ups.trips (status);

