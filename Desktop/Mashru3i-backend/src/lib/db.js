import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // ssl: { rejectUnauthorized: false } // if needed for hosted DBs
});

export const query = (text, params) => pool.query(text, params);
