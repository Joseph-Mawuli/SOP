// config/database.js
// PostgreSQL Database Connection Pool

const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    })
  : new Pool({
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'pos_system',
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    });

// Test the connection
pool.on('connect', () => {
  console.log('✓ Database connection pool established');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Query function with error handling
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Get a client from the pool
const getClient = async () => {
  const client = await pool.connect();
  return client;
};

module.exports = {
  pool,
  query,
  getClient
};
