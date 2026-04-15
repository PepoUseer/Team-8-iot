import { Pool } from "pg";


class Database {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL
        });
        this.verifyConnection();
    }

    async verifyConnection() {
        try {
            const client = await this.pool.connect();
            client.release();
        } catch (err) {
            console.error("Database connection error:", err.stack);
            process.exit(1);
    }
    }

    async query(text, params) {
        try {
            return await this.pool.query(text, params);
        } catch (err) {
            console.error("Query error:", err.stack);
            throw err;
        }
    }
}

const db = new Database();
export default db;