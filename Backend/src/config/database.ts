import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    connectionString: process.env.Database_URI,
    ssl: { rejectUnauthorized: false }
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export default query;

