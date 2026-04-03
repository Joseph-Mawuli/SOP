#!/bin/bash
# Quick fix script for Paystack payment method support
# Run this in psql or through your database tool

# Connect to the POS database and run:

psql -U postgres -d pos_system -c "
ALTER TABLE payments
DROP CONSTRAINT IF EXISTS payments_payment_method_check;

ALTER TABLE payments
ADD CONSTRAINT payments_payment_method_check 
CHECK (payment_method IN ('cash', 'mobile_money', 'card', 'split', 'paystack'));

SELECT 'Paystack support added successfully! Payment methods: cash, mobile_money, card, split, paystack';"
