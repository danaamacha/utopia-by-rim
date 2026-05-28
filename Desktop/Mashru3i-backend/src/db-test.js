require('dotenv').config();
const { q } = require('./db');

(async () => {
  try {
    const { rows } = await q('SELECT now() as db_time, current_database() as db');
    console.log('✅ Connected to database:', rows[0].db, 'at', rows[0].db_time);
    process.exit(0);
  } catch (e) {
    console.error('❌ DB connection failed:', e.message);
    process.exit(1);
  }
})();
