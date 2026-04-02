// controllers/paymentController.js
// Payment Processing Route Handlers

const paymentService = require('../services/paymentService');
const auditLogService = require('../services/auditLogService');

// Process Payment
const processPayment = async (req, res, next) => {
  try {
    const { sale_id, payment_method, amount_paid, payment_details } = req.body;

    if (!sale_id || !payment_method || !amount_paid) {
      return res.status(400).json({
        success: false,
        message: 'Sale ID, payment method, and amount are required'
      });
    }

    const payment = await paymentService.processPayment({
      sale_id,
      payment_method,
      amount_paid,
      payment_details
    });

    // Log audit trail
    try {
      await auditLogService.logAction({
        user_id: req.user.user_id,
        action: 'CREATE',
        entity_type: 'payment',
        entity_id: payment.payment_id,
        old_values: null,
        new_values: { sale_id, payment_method, amount_paid },
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success'
      });
    } catch (auditError) {
      console.error('Audit logging error:', auditError);
    }

    res.status(201).json({
      success: true,
      message: 'Payment processed successfully',
      data: payment
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Payment processing failed'
    });
  }
};

// Get Payment by ID
const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await paymentService.getPaymentById(id);

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Payment not found'
    });
  }
};

// Get Payment by Sale ID
const getPaymentBySaleId = async (req, res, next) => {
  try {
    const { saleId } = req.params;

    const payment = await paymentService.getPaymentBySaleId(saleId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Get payment by sale error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get payment'
    });
  }
};

// Get Payment History
const getPaymentHistory = async (req, res, next) => {
  try {
    const { payment_method, start_date, end_date } = req.query;

    const history = await paymentService.getPaymentHistory({
      payment_method,
      start_date,
      end_date
    });

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get history'
    });
  }
};

// Get Payment Statistics
const getPaymentStats = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const stats = await paymentService.getPaymentStats(start_date, end_date);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get statistics'
    });
  }
};

// ==================== PAYSTACK INTEGRATION ENDPOINTS ====================

// Initialize Paystack Payment
const initializePaystackPayment = async (req, res, next) => {
  try {
    const {
      sale_id,
      customer_email,
      amount_paid,
      customer_name,
      customer_phone
    } = req.body;

    if (!sale_id || !customer_email || !amount_paid) {
      return res.status(400).json({
        success: false,
        message: 'Sale ID, customer email, and amount are required'
      });
    }

    const result = await paymentService.initializePaystackPayment({
      sale_id,
      customer_email,
      amount_paid,
      customer_name,
      customer_phone
    });

    // Log audit trail
    try {
      await auditLogService.logAction({
        user_id: req.user.user_id,
        action: 'CREATE',
        entity_type: 'paystack_payment',
        entity_id: result.reference,
        old_values: null,
        new_values: { sale_id, customer_email, amount_paid },
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success'
      });
    } catch (auditError) {
      console.error('Audit logging error:', auditError);
    }

    res.status(200).json({
      success: true,
      message: 'Paystack payment initialized',
      data: result
    });
  } catch (error) {
    console.error('Initialize Paystack payment error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to initialize payment'
    });
  }
};

// Verify Paystack Payment
const verifyPaystackPayment = async (req, res, next) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'Payment reference is required'
      });
    }

    const result = await paymentService.verifyPaystackPayment(reference);

    // Log audit trail
    try {
      await auditLogService.logAction({
        user_id: req.user?.user_id,
        action: 'UPDATE',
        entity_type: 'paystack_payment',
        entity_id: reference,
        old_values: null,
        new_values: { status: 'verified' },
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success'
      });
    } catch (auditError) {
      console.error('Audit logging error:', auditError);
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: result
    });
  } catch (error) {
    console.error('Verify Paystack payment error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to verify payment'
    });
  }
};

// Handle Paystack Webhook
const handlePaystackWebhook = async (req, res, next) => {
  try {
    const event = req.body;

    // Verify webhook signature here if needed
    // This is a simplified version - implement proper signature verification in production

    const result = await paymentService.handlePaystackWebhook(event);

    res.status(200).json({
      success: true,
      message: 'Webhook handled successfully',
      data: result
    });
  } catch (error) {
    console.error('Handle Paystack webhook error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to handle webhook'
    });
  }
};

// Get Paystack Payment Details
const getPaystackPaymentDetails = async (req, res, next) => {
  try {
    const { saleId } = req.params;

    const payment = await paymentService.getPaystackPaymentDetails(saleId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Paystack payment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Get Paystack payment details error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get payment details'
    });
  }
};

module.exports = {
  processPayment,
  getPaymentById,
  getPaymentBySaleId,
  getPaymentHistory,
  getPaymentStats,
  // Paystack methods
  initializePaystackPayment,
  verifyPaystackPayment,
  handlePaystackWebhook,
  getPaystackPaymentDetails
};
