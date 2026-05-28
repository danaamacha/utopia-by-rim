// src/db.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // If your provider needs SSL, uncomment:
  // ssl: { rejectUnauthorized: false }
});

// Convenience query helper (same signature as pool.query)
const q = (text, params) => pool.query(text, params);

module.exports = { pool, q };
