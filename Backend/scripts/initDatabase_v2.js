// scripts/initDatabase.js - Updated
// Initialize POS System Database with Paystack support

const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function initializeDatabase() {
  try {
    console.log('Connecting to database...');
    await client.connect();

    console.log('Reading schema files...');
    const fs = require('fs');
    const path = require('path');

    // Read main schema
    const schemaPath = path.join(__dirname, '../database_schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf-8');

    // Read additions schema
    const additionsPath = path.join(__dirname, '../database_schema_additions.sql');
    const additionsSQL = fs.readFileSync(additionsPath, 'utf-8');

    console.log('Creating/updating database schema...');
    
    // Execute main schema
    const statements = schemaSQL.split(';').filter(stmt => stmt.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await client.query(statement);
        } catch (error) {
          // Table already exists, continue
          if (!error.message.includes('already exists')) {
            console.warn('Statement warning:', error.message);
          }
        }
      }
    }

    // Execute additions schema
    const additionStatements = additionsSQL.split(';').filter(stmt => stmt.trim());
    for (const statement of additionStatements) {
      if (statement.trim()) {
        try {
          await client.query(statement);
        } catch (error) {
          if (!error.message.includes('already exists')) {
            console.warn('Addition statement warning:', error.message);
          }
        }
      }
    }

    // Update payment_method check constraint to include 'paystack'
    console.log('Updating payment method constraint to support Paystack...');
    try {
      await client.query(`
        ALTER TABLE payments
        DROP CONSTRAINT payments_payment_method_check;
      `);
    } catch (error) {
      console.log('Constraint may not exist yet, creating new one...');
    }

    await client.query(`
      ALTER TABLE payments
      ADD CONSTRAINT payments_payment_method_check 
      CHECK (payment_method IN ('cash', 'mobile_money', 'card', 'split', 'paystack'));
    `);

    console.log('✓ Database initialized successfully with Paystack support');
    console.log('✓ Payment methods: cash, mobile_money, card, split, paystack');

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
}

initializeDatabase();
