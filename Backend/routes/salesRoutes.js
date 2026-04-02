// routes/salesRoutes.js
// Sales Processing API Routes

const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Protected routes (cashier and administrator can create sales)
router.post('/', verifyToken, requireRole('cashier', 'administrator', 'manager'), salesController.createSale);
router.get('/', verifyToken, salesController.getAllSales);
router.get('/summary/daily', verifyToken, salesController.getDailySalesSummary);
router.get('/summary/weekly', verifyToken, salesController.getWeeklySalesSummary);
router.get('/performance/cashier', verifyToken, requireRole('administrator', 'manager'), salesController.getCashierPerformance);
router.get('/daily', verifyToken, salesController.getDailySales);
router.get('/:id', verifyToken, salesController.getSaleById);

module.exports = router;
