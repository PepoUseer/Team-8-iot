import db from "../db.js";

class AuthService {

    /**
     * 
     * @param {string} username 
     * @param {string} email 
     * @param {string} passwordHash 
     * @returns {}
     */
    async createUser(username, email, passwordHash) {
        const queryText = `
            INSERT INTO users (username, email, password_hash)
            VALUES ($1, $2, $3)
            RETURNING user_id, username, email, password_hash, created_at
        `;
        const result = await db.query(queryText, [username, email, passwordHash]);
        return result.rows[0];
    }

    async getUserByUsername(username) {
        const queryText = 'SELECT user_id, username, email, password_hash, created_at FROM users WHERE username = $1';
        const result = await db.query(queryText, [username]);
        return result.rows[0] || null;
    }

    async getUserByEmail(email) {
        const queryText = 'SELECT user_id, username, email, password_hash, created_at FROM users WHERE email = $1';
        const result = await db.query(queryText, [email]);
        return result.rows[0] || null;
    }
}

const authService = new AuthService();
export default authService;