// scripts/initDatabase.js
// Initialize PostgreSQL database schema

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function initializeDatabase() {
  try {
    console.log('Starting database initialization...');

    // Read the SQL schema file
    const schemaPath = path.join(__dirname, '../database_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Split the schema into individual statements
    // Remove comments and split by semicolon
    const lines = schema.split('\n');
    let statements = [];
    let currentStatement = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      // Skip empty lines and comment-only lines
      if (!trimmedLine || trimmedLine.startsWith('--')) {
        continue;
      }
      currentStatement += ' ' + trimmedLine;
      if (trimmedLine.endsWith(';')) {
        statements.push(currentStatement.trim());
        currentStatement = '';
      }
    }
    
    // Filter out empty statements
    statements = statements.filter(stmt => stmt.length > 0);

    const client = await pool.connect();
    
    try {
      console.log(`Executing ${statements.length} SQL statements...`);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        console.log(`[${i + 1}/${statements.length}] Executing statement...`);
        await client.query(statement);
      }
      
      console.log('✓ Database schema initialized successfully!');
      console.log('✓ All tables created and indexes configured');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('✗ Error initializing database:', error.message);
    if (error.detail) console.error('Detail:', error.detail);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run initialization
initializeDatabase();
