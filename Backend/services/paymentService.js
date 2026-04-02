// services/paymentService.js
// Payment Processing Business Logic

const { query } = require('../config/database');
const paystackClient = require('../config/paystack');

// Process Payment
const processPayment = async (paymentData) => {
  try {
    // Validate payment method
    const validMethods = ['cash', 'mobile_money', 'card', 'split', 'paystack'];
    if (!validMethods.includes(paymentData.payment_method)) {
      throw { message: 'Invalid payment method' };
    }

    // Get sale to verify amount
    const saleResult = await query(
      'SELECT total_amount FROM sales WHERE sale_id = $1',
      [paymentData.sale_id]
    );

    if (saleResult.rows.length === 0) {
      throw { message: 'Sale not found' };
    }

    const saleTotal = parseFloat(saleResult.rows[0].total_amount);

    // Calculate change
    const amountPaid = parseFloat(paymentData.amount_paid);
    if (amountPaid < saleTotal) {
      throw { message: 'Amount paid is less than sale total' };
    }

    const changeAmount = amountPaid - saleTotal;

    // Record payment
    const result = await query(
      `INSERT INTO payments (sale_id, payment_method, amount_paid, change_amount, payment_status, payment_details)
       VALUES ($1, $2, $3, $4, 'completed', $5)
       RETURNING *`,
      [
        paymentData.sale_id,
        paymentData.payment_method,
        amountPaid,
        changeAmount,
        JSON.stringify(paymentData.payment_details || {})
      ]
    );

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Get Payment by Sale ID
const getPaymentBySaleId = async (saleId) => {
  try {
    const result = await query(
      'SELECT * FROM payments WHERE sale_id = $1',
      [saleId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Get Payment by Payment ID
const getPaymentById = async (paymentId) => {
  try {
    const result = await query(
      'SELECT * FROM payments WHERE payment_id = $1',
      [paymentId]
    );

    if (result.rows.length === 0) {
      throw { message: 'Payment not found' };
    }

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Get Payment History
const getPaymentHistory = async (filters = {}) => {
  try {
    let query_text = 'SELECT p.*, s.transaction_id, s.total_amount FROM payments p JOIN sales s ON p.sale_id = s.sale_id WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.payment_method) {
      query_text += ` AND p.payment_method = $${paramCount}`;
      params.push(filters.payment_method);
      paramCount++;
    }

    if (filters.start_date) {
      query_text += ` AND p.created_at >= $${paramCount}::date`;
      params.push(filters.start_date);
      paramCount++;
    }

    if (filters.end_date) {
      query_text += ` AND p.created_at <= $${paramCount}::date + INTERVAL '1 day'`;
      params.push(filters.end_date);
      paramCount++;
    }

    query_text += ' ORDER BY p.created_at DESC';

    const result = await query(query_text, params);
    return result.rows;
  } catch (error) {
    throw error;
  }
};

// Get Payment Statistics
const getPaymentStats = async (startDate, endDate) => {
  try {
    const result = await query(
      `SELECT 
        payment_method,
        COUNT(*) as transaction_count,
        SUM(amount_paid) as total_amount,
        SUM(change_amount) as total_change
       FROM payments
       WHERE created_at >= $1::date AND created_at < $2::date + INTERVAL '1 day'
       GROUP BY payment_method
       ORDER BY total_amount DESC`,
      [startDate, endDate]
    );

    return result.rows;
  } catch (error) {
    throw error;
  }
};

// Calculate Change
const calculateChange = (saleTotal, amountPaid) => {
  return Math.max(0, parseFloat(amountPaid) - parseFloat(saleTotal));
};

// Validate Payment Amount
const validatePaymentAmount = async (saleId, amountPaid) => {
  try {
    const result = await query(
      'SELECT total_amount FROM sales WHERE sale_id = $1',
      [saleId]
    );

    if (result.rows.length === 0) {
      throw { message: 'Sale not found' };
    }

    const saleTotal = parseFloat(result.rows[0].total_amount);
    const amount = parseFloat(amountPaid);

    return {
      isValid: amount >= saleTotal,
      saleTotal,
      amountPaid: amount,
      change: amount - saleTotal
    };
  } catch (error) {
    throw error;
  }
};

// ==================== PAYSTACK INTEGRATION ====================

// Initialize Paystack Payment
const initializePaystackPayment = async (paymentData) => {
  try {
    const {
      sale_id,
      customer_email,
      amount_paid,
      customer_name,
      customer_phone
    } = paymentData;

    // Get sale details
    const saleResult = await query(
      'SELECT total_amount, customer_id FROM sales WHERE sale_id = $1',
      [sale_id]
    );

    if (saleResult.rows.length === 0) {
      throw { message: 'Sale not found' };
    }

    const saleTotal = parseInt(parseFloat(saleResult.rows[0].total_amount) * 100); // Convert to kobo (smallest unit)

    // Initialize transaction with Paystack API
    const response = await paystackClient.post('/transaction/initialize', {
      email: customer_email,
      amount: saleTotal,
      metadata: {
        sale_id,
        customer_name,
        customer_phone,
        custom_fields: [
          {
            display_name: 'Sale ID',
            variable_name: 'sale_id',
            value: sale_id
          }
        ]
      }
    });

    if (!response.data.status) {
      throw { message: 'Failed to initialize Paystack payment' };
    }

    // Store pending payment
    await query(
      `INSERT INTO payments (sale_id, payment_method, amount_paid, payment_status, payment_details)
       VALUES ($1, 'paystack', $2, 'pending', $3)`,
      [
        sale_id,
        amount_paid,
        JSON.stringify({
          paystack_reference: response.data.data.reference,
          access_code: response.data.data.access_code,
          authorization_url: response.data.data.authorization_url,
          initiated_at: new Date().toISOString()
        })
      ]
    );

    return {
      success: true,
      authorization_url: response.data.data.authorization_url,
      access_code: response.data.data.access_code,
      reference: response.data.data.reference
    };
  } catch (error) {
    throw error;
  }
};

// Verify Paystack Payment
const verifyPaystackPayment = async (reference) => {
  try {
    // Verify with Paystack API
    const response = await paystackClient.get(`/transaction/verify/${reference}`);

    if (!response.data.status) {
      throw { message: 'Paystack verification failed' };
    }

    const transactionData = response.data.data;

    if (transactionData.status === 'success') {
      // Update payment status to completed
      const paymentResult = await query(
        `UPDATE payments 
         SET payment_status = 'completed',
             payment_details = $1,
             updated_at = NOW()
         WHERE payment_details::jsonb->>'paystack_reference' = $2
         RETURNING *`,
        [
          JSON.stringify({
            ...transactionData,
            verified_at: new Date().toISOString()
          }),
          reference
        ]
      );

      if (paymentResult.rows.length === 0) {
        throw { message: 'Payment record not found' };
      }

      return {
        success: true,
        payment: paymentResult.rows[0],
        transaction: transactionData
      };
    } else {
      // Update payment status to failed
      await query(
        `UPDATE payments 
         SET payment_status = 'failed',
             payment_details = $1,
             updated_at = NOW()
         WHERE payment_details::jsonb->>'paystack_reference' = $2`,
        [
          JSON.stringify({
            ...transactionData,
            verified_at: new Date().toISOString()
          }),
          reference
        ]
      );

      throw { message: 'Payment verification failed', transaction: transactionData };
    }
  } catch (error) {
    throw error;
  }
};

// Handle Paystack Webhook
const handlePaystackWebhook = async (event_data) => {
  try {
    const { reference, status } = event_data;

    if (status === 'success') {
      // Verify the payment
      return await verifyPaystackPayment(reference);
    } else {
      // Update payment status to failed
      await query(
        `UPDATE payments 
         SET payment_status = 'failed',
             updated_at = NOW()
         WHERE payment_details::jsonb->>'paystack_reference' = $1`,
        [reference]
      );

      return {
        success: false,
        message: 'Payment failed',
        reference
      };
    }
  } catch (error) {
    throw error;
  }
};

// Get Paystack Payment Details
const getPaystackPaymentDetails = async (saleId) => {
  try {
    const result = await query(
      `SELECT * FROM payments 
       WHERE sale_id = $1 AND payment_method = 'paystack'`,
      [saleId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

module.exports = {
  processPayment,
  getPaymentBySaleId,
  getPaymentById,
  getPaymentHistory,
  getPaymentStats,
  calculateChange,
  validatePaymentAmount,
  // Paystack methods
  initializePaystackPayment,
  verifyPaystackPayment,
  handlePaystackWebhook,
  getPaystackPaymentDetails
};
