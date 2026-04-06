// scripts/runMigration_payments_updated_at.js
// Run the migration to add updated_at column to payments table
// Usage: node runMigration_payments_updated_at.js

const { query } = require("../config/database");
const fs = require("fs");
const path = require("path");

async function runMigration() {
  try {
    console.log("Starting migration: Add updated_at to payments table...");

    // Check if column already exists
    const checkResult = await query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='payments' AND column_name='updated_at'
      ) as column_exists;
    `);

    if (checkResult.rows[0].column_exists) {
      console.log("✓ Column updated_at already exists in payments table");
      process.exit(0);
    }

    // Add the column
    console.log("Adding updated_at column to payments table...");
    await query(`
      ALTER TABLE payments 
      ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    // Update existing records
    console.log("Populating updated_at for existing records...");
    await query(`
      UPDATE payments SET updated_at = created_at WHERE updated_at IS NULL;
    `);

    // Add NOT NULL constraint
    console.log("Adding NOT NULL constraint...");
    await query(`
      ALTER TABLE payments 
      ALTER COLUMN updated_at SET NOT NULL;
    `);

    console.log("✓ Migration completed successfully!");
    console.log("✓ The payments table now has the updated_at column");
    process.exit(0);
  } catch (error) {
    console.error("✗ Migration failed:", error.message);
    process.exit(1);
  }
}

runMigration();
