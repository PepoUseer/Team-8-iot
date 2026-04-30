import db from "../db.js";
import sensorDefaults from "../config/sensorDefaults.json" with { type: "json" };

class DeviceService {
    /**
     * 
     * @param {string} id 
     */
    async get(id) {
        const queryText = `
            SELECT device_id, device_name, last_update FROM devices
            WHERE device_id = $1
        `;
        const result = await db.query(queryText, [id]);
        return result.rows[0] || null;
    }

    /**
     * Get all sensors for a device
     * @param {string} deviceId 
     */
    async getSensors(deviceId) {
        const queryText = `
            SELECT sensor_id, device_id, sensor_type, unit, threshold_min, threshold_max
            FROM sensors
            WHERE device_id = $1
        `;
        const result = await db.query(queryText, [deviceId]);
        return result.rows;
    }

    /**
     * Create a new device with associated sensors
     * @param {[{sensorType: string, unit: string}]} sensors 
     */
    async create(sensors) {
        const client = await db.pool.connect();
        try {
            await client.query("BEGIN");

            const defaultName = "New Device";
            const queryText = `
                INSERT INTO devices (device_name)
                VALUES ($1)
                RETURNING device_id, device_name
            `;
            const result = await client.query(queryText, [defaultName]);
            const device = result.rows[0];
            
            if (sensors && Array.isArray(sensors) && sensors.length > 0) {
                for (const sensor of sensors) {
                    let defaults = sensorDefaults[sensor.sensorType];
                    if (!defaults) {
                        defaults = {
                            unit: sensor.unit,
                            threshold_min: 0,
                            threshold_max: 1
                        }
                    }
                    const sensorQueryText = `
                            INSERT INTO sensors (device_id, sensor_type, unit, threshold_min, threshold_max)
                            VALUES ($1, $2, $3, $4, $5)
                        `;
                    await client.query(sensorQueryText, [
                        device.device_id,
                        sensor.sensorType,
                        defaults.unit,
                        defaults.threshold_min,
                        defaults.threshold_max
                    ]);
                }
            }

            await client.query("COMMIT");
            return device;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * 
     * @param {string} id
     * @param {string} deviceName
     */
    async update(id, deviceName) {
        const queryText = `UPDATE devices
            SET device_name = COALESCE($2, device_name)
            WHERE device_id = $1
            RETURNING device_id, device_name, last_update
        `;
        const result = await db.query(queryText, [id, deviceName]);
        return result.rows[0] || null;
    }

    /**
     * 
     * @param {string} id 
     */
    async delete(id) {
        const queryText = `DELETE FROM devices 
            WHERE device_id = $1 RETURNING device_id
        `;
        const result = await db.query(queryText, [id]);
        return result.rows[0] || null;
    }

    /**
     * Fetch a device alias entry from the database
     * @param {string} deviceAlias - The alias to look up
     * @returns {Promise<{device_alias: string, device_id: string|null}|null>}
     */
    async getAliasByName(deviceAlias) {
        const queryText = `
            SELECT device_alias, device_id FROM device_aliases
            WHERE device_alias = $1
        `;
        const result = await db.query(queryText, [deviceAlias]);
        return result.rows[0] || null;
    }

    /**
     * Create a new device or return existing device linked to alias
     * @param {string} deviceAlias - The device alias (must exist in device_aliases table)
     * @param {[{sensorType: string, unit: string}]} sensors 
     */
    async createOrGet(deviceAlias, sensors) {
        const client = await db.pool.connect();
        try {
            await client.query("BEGIN");

            // If alias already has a device_id, return the existing device
            const aliasQuery = `
                SELECT device_id FROM device_aliases
                WHERE device_alias = $1
            `;
            const aliasResult = await client.query(aliasQuery, [deviceAlias]);
            const aliasRow = aliasResult.rows[0];

            if (aliasRow && aliasRow.device_id) {
                const existingDeviceQuery = `
                    SELECT device_id, device_name, last_update FROM devices
                    WHERE device_id = $1
                `;
                const existingDeviceResult = await client.query(existingDeviceQuery, [aliasRow.device_id]);
                await client.query("COMMIT");
                return {
                    created: false,
                    device: existingDeviceResult.rows[0]
                };
            }

            // Create new device
            const defaultName = "New Device";
            const createDeviceQuery = `
                INSERT INTO devices (device_name)
                VALUES ($1)
                RETURNING device_id, device_name, last_update
            `;
            const deviceResult = await client.query(createDeviceQuery, [defaultName]);
            const device = deviceResult.rows[0];
            
            // Link the alias to the new device
            const linkAliasQuery = `
                UPDATE device_aliases
                SET device_id = $1
                WHERE device_alias = $2
            `;
            await client.query(linkAliasQuery, [device.device_id, deviceAlias]);
            
            // Create sensors if provided
            if (sensors && Array.isArray(sensors) && sensors.length > 0) {
                for (const sensor of sensors) {
                    let defaults = sensorDefaults[sensor.sensorType];
                    if (!defaults) {
                        defaults = {
                            unit: sensor.unit,
                            threshold_min: 0,
                            threshold_max: 1
                        }
                    }
                    const sensorQueryText = `
                        INSERT INTO sensors (device_id, sensor_type, unit, threshold_min, threshold_max)
                        VALUES ($1, $2, $3, $4, $5)
                    `;
                    await client.query(sensorQueryText, [
                        device.device_id,
                        sensor.sensorType,
                        defaults.unit,
                        defaults.threshold_min,
                        defaults.threshold_max
                    ]);
                }
            }

            await client.query("COMMIT");
            return {
                created: true,
                device: device
            };
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Link a user to a device
     * @param {string} userId 
     * @param {string} deviceId 
     */
    async linkUser(userId, deviceId) {
        const queryText = `
            INSERT INTO user_devices (user_id, device_id)
            VALUES ($1, $2)
            RETURNING user_id, device_id, added_at
        `;
        const result = await db.query(queryText, [userId, deviceId]);
        return result.rows[0] || null;
    }

    /**
     * Get all devices for a user
     * @param {string} userId 
     */
    async getForUser(userId) {
        const queryText = `
            SELECT d.device_id, d.device_name, d.last_update
            FROM devices d
            JOIN user_devices ud ON d.device_id = ud.device_id
            WHERE ud.user_id = $1
        `;
        const result = await db.query(queryText, [userId]);
        return result.rows;
    }

    /**
     * Check if a user is linked to a device
     * @param {string} userId 
     * @param {string} deviceId 
     * @returns {Promise<{user_id: string, device_id: string, added_at: TIMESTAMPTZ}|null>}
     */
    async isUserLinked(userId, deviceId) {
        const queryText = `
            SELECT user_id, device_id, added_at
            FROM user_devices
            WHERE user_id = $1 AND device_id = $2
        `;
        const result = await db.query(queryText, [userId, deviceId]);
        return result.rows[0] || null;
    }
}

const deviceService = new DeviceService();
export default deviceService;