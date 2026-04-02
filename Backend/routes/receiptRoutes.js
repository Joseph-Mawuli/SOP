// routes/receiptRoutes.js
// Receipt Generation API Routes

const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');
const { verifyToken } = require('../middleware/auth');

// Protected routes (require authentication)
router.get('/recent', verifyToken, receiptController.getRecentReceipts);
router.get('/:saleId', verifyToken, receiptController.getReceipt);
router.get('/:saleId/text', verifyToken, receiptController.getReceiptText);

module.exports = router;
