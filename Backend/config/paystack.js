// config/paystack.js
// Paystack API Configuration - Using axios (secure, no deprecated dependencies)

const axios = require('axios');

const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_placeholder_replace_with_your_actual_key';

// Create axios instance with Paystack auth
const paystackClient = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  }
});

module.exports = paystackClient;

