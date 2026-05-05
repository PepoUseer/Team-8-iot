import db from "../db.js";

class ReadingsService {
    /**
     * Create new readings for a device
     * @param {string} deviceId - UUID of the device
     * @param {[{sensorType: string, value: number}]} readings - Array of readings
     * @param {Date} timestamp - Time when reading was created
     */
    async create(deviceId, readings, timestamp = new Date()) {
        const client = await db.pool.connect();
        try {
            await client.query("BEGIN");

            // Get all sensors for the device
            const sensorsQueryText = `
                SELECT sensor_id, sensor_type
                FROM sensors
                WHERE device_id = $1
            `;
            const sensorsResult = await client.query(sensorsQueryText, [deviceId]);
            const sensors = sensorsResult.rows;

            if (sensors.length === 0) {
                throw new Error(`No sensors found for device ${deviceId}`);
            }

            const sensorMap = {};
            sensors.forEach(sensor => {
                sensorMap[sensor.sensor_type] = sensor.sensor_id;
            });

            // Insert all readings
            const createdReadings = [];

            for (const reading of readings) {
                const sensorId = sensorMap[reading.sensorType];
                if (!sensorId) {
                    throw new Error(`No sensor found for device ${deviceId} with type ${reading.sensorType}`);
                }

                const readingQueryText = `
                    INSERT INTO air_quality_readings (time, sensor_id, value)
                    VALUES ($1, $2, $3)
                    RETURNING time, sensor_id, value
                `;
                const readingResult = await client.query(readingQueryText, [timestamp, sensorId, reading.value]);
                createdReadings.push(readingResult.rows[0]);
            }

            await client.query("COMMIT");
            return createdReadings;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }
}

const readingsService = new ReadingsService();
export default readingsService;
