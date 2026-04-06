-- Migration: Add updated_at column to payments table
-- This adds the missing updated_at column that paymentService.js requires
-- Date: 2026-04-06

-- Check if column exists before adding (PostgreSQL safe pattern)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='payments' AND column_name='updated_at'
  ) THEN
    ALTER TABLE payments 
    ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    
    -- Update existing records so they have a valid timestamp
    UPDATE payments SET updated_at = created_at WHERE updated_at IS NULL;
    
    -- Add NOT NULL constraint after populating
    ALTER TABLE payments 
    ALTER COLUMN updated_at SET NOT NULL;
    
    RAISE NOTICE 'Successfully added updated_at column to payments table';
  ELSE
    RAISE NOTICE 'Column updated_at already exists in payments table';
  END IF;
END $$;
