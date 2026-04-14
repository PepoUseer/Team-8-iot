import { Pool } from "pg";


class Database {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL
        });
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