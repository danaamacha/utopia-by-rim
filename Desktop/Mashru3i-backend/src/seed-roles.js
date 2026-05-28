// src/seed-roles.js
require('dotenv').config();
const { q } = require('./db');

(async () => {
  await q(`
    INSERT INTO roles (key, name) VALUES
    ('customer','Customer'),
    ('driver','Driver'),
    ('business','Business'),
    ('admin','Admin'),
    ('support','Support')
    ON CONFLICT (key) DO NOTHING
  `);
  console.log("✅ Roles seeded");
  process.exit(0);
})();
