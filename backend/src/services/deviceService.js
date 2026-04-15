import db from "../db.js";

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
     * 
     * @param {[{sensorType: string, unit: string}]} sensors 
     */
    async create(sensors) {
        const defaultName = "New Device";
        const queryText = `
            INSERT INTO devices (device_name)
            VALUES ($1)
            RETURNING device_id, device_name
        `;
        const result = await db.query(queryText, [defaultName]);
        return result.rows[0];
    }
}

const deviceService = new DeviceService();
export default deviceService;