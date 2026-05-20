import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString =
    process.env.Database_URI ||
    process.env.DATABASE_URI;

const pool = new Pool({
    connectionString,
    ssl: connectionString ? { rejectUnauthorized: false } : undefined,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export default query;

