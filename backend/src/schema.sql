-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Devices Table
CREATE TABLE IF NOT EXISTS devices (
    device_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_name VARCHAR(100),
    last_update TIMESTAMPTZ
);

-- 3. User-Devices Junction Table
CREATE TABLE IF NOT EXISTS user_devices (
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(device_id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, device_id)
);

-- 4. Sensors Table
CREATE TABLE IF NOT EXISTS sensors (
    sensor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
    sensor_type VARCHAR(20) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    threshold_min DOUBLE PRECISION NOT NULL,
    threshold_max DOUBLE PRECISION NOT NULL
);

-- 5. Air Quality Readings
CREATE TABLE IF NOT EXISTS air_quality_readings (
    time TIMESTAMPTZ NOT NULL,
    sensor_id UUID NOT NULL REFERENCES sensors(sensor_id) ON DELETE CASCADE,
    value DOUBLE PRECISION NOT NULL,
    PRIMARY KEY (sensor_id, time)
);