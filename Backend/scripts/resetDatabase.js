// scripts/resetDatabase.js
// Reset and reinitialize PostgreSQL database schema

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function resetDatabase() {
  try {
    console.log('Starting database reset...');

    const client = await pool.connect();
    
    try {
      // Drop all tables in reverse order of dependencies
      console.log('Dropping existing tables...');
      const dropStatements = [
        'DROP TABLE IF EXISTS inventory_adjustments CASCADE;',
        'DROP TABLE IF EXISTS payments CASCADE;',
        'DROP TABLE IF EXISTS sales_items CASCADE;',
        'DROP TABLE IF EXISTS sales CASCADE;',
        'DROP TABLE IF EXISTS inventory CASCADE;',
        'DROP TABLE IF EXISTS customers CASCADE;',
        'DROP TABLE IF EXISTS products CASCADE;',
        'DROP TABLE IF EXISTS users CASCADE;'
      ];

      for (const statement of dropStatements) {
        await client.query(statement);
      }
      console.log('✓ All tables dropped');

      // Read and execute the new schema
      const schemaPath = path.join(__dirname, '../database_schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf-8');

      // Split the schema into individual statements
      const lines = schema.split('\n');
      let statements = [];
      let currentStatement = '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('--')) {
          continue;
        }
        currentStatement += ' ' + trimmedLine;
        if (trimmedLine.endsWith(';')) {
          statements.push(currentStatement.trim());
          currentStatement = '';
        }
      }
      
      statements = statements.filter(stmt => stmt.length > 0);

      console.log(`Creating new schema with ${statements.length} statements...`);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        await client.query(statement);
      }
      
      console.log('✓ Database reset and schema recreated successfully!');
      console.log('✓ All tables created with role structure (administrator, cashier)');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('✗ Error resetting database:', error.message);
    if (error.detail) console.error('Detail:', error.detail);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run reset
resetDatabase();
