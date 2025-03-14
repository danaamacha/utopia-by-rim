// db.js
const { Client } = require("pg");
require("dotenv").config(); // Load environment variables

// Database connection configuration using DB_URI
const client = new Client({
  connectionString: process.env.DB_URI, // Use DB_URI from .env
});

client.connect()
  .then(() => {
    console.log('Connected to the database');
  })
  .catch(err => {
    console.error('Connection error', err.stack);
  });

// Export the client to be used in other files
module.exports = client;
