// routes/paymentRoutes.js
// Payment Processing API Routes

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Protected routes (cashier and admin can process payments)
router.post('/', verifyToken, requireRole('cashier', 'administrator', 'manager'), paymentController.processPayment);
router.get('/history', verifyToken, paymentController.getPaymentHistory);
router.get('/stats', verifyToken, requireRole('administrator', 'manager'), paymentController.getPaymentStats);
router.get('/sale/:saleId', verifyToken, paymentController.getPaymentBySaleId);
router.get('/:id', verifyToken, paymentController.getPaymentById);

// ==================== PAYSTACK ROUTES ====================

// Initialize Paystack payment
router.post('/paystack/initialize', verifyToken, requireRole('cashier', 'administrator', 'manager'), paymentController.initializePaystackPayment);

// Verify Paystack payment
router.get('/paystack/verify/:reference', verifyToken, paymentController.verifyPaystackPayment);

// Webhook for Paystack (usually no authentication required from Paystack's side, but you should verify the webhook signature)
router.post('/paystack/webhook', paymentController.handlePaystackWebhook);

// Get Paystack payment details
router.get('/paystack/details/:saleId', verifyToken, paymentController.getPaystackPaymentDetails);

module.exports = router;
