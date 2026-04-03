-- Migration: Add Paystack payment method support
-- This script updates the payments table to support 'paystack' as a valid payment method

-- Drop the old check constraint
ALTER TABLE payments
DROP CONSTRAINT payments_payment_method_check;

-- Add new check constraint with paystack included
ALTER TABLE payments
ADD CONSTRAINT payments_payment_method_check 
CHECK (payment_method IN ('cash', 'mobile_money', 'card', 'split', 'paystack'));

-- Verify the change
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'payments' AND constraint_name LIKE '%payment_method%';
