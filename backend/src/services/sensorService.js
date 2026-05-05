import db from "../db.js";

class SensorService {
    /**
     * Get a sensor by ID
     * @param {string} id 
     */
    async get(id) {
        const queryText = `
            SELECT sensor_id, device_id, sensor_type, unit, threshold_min, threshold_max
            FROM sensors
            WHERE sensor_id = $1
        `;
        const result = await db.query(queryText, [id]);
        return result.rows[0] || null;
    }

    /**
     * Create a new sensor
     * @param {string} deviceId
     * @param {string} sensorType 
     * @param {string} unit 
     * @param {number} thresholdMin 
     * @param {number} thresholdMax 
     */
    async create(deviceId, sensorType, unit, thresholdMin, thresholdMax) {
        const queryText = `
            INSERT INTO sensors (device_id, sensor_type, unit, threshold_min, threshold_max)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING sensor_id, device_id, sensor_type, unit, threshold_min, threshold_max
        `;
        const result = await db.query(queryText, [deviceId, sensorType, unit, thresholdMin, thresholdMax]);
        return result.rows[0];
    }

    /**
     * Update a sensor
     * @param {string} id 
     * @param {object} updates - Object containing fields to update
     */
    async update(id, updates) {
        const { sensorType, unit, thresholdMin, thresholdMax } = updates;
        const queryText = `
            UPDATE sensors
            SET sensor_type = COALESCE($2, sensor_type),
                unit = COALESCE($3, unit),
                threshold_min = COALESCE($4, threshold_min),
                threshold_max = COALESCE($5, threshold_max)
            WHERE sensor_id = $1
            RETURNING sensor_id, device_id, sensor_type, unit, threshold_min, threshold_max
        `;
        const result = await db.query(queryText, [id, sensorType, unit, thresholdMin, thresholdMax]);
        return result.rows[0] || null;
    }

    /**
     * Delete a sensor
     * @param {string} id 
     */
    async delete(id) {
        const queryText = `
            DELETE FROM sensors 
            WHERE sensor_id = $1 
            RETURNING sensor_id
        `;
        const result = await db.query(queryText, [id]);
        return result.rows[0] || null;
    }
}

const sensorService = new SensorService();
export default sensorService;