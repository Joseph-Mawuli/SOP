// routes/reportRoutes.js
// Reporting and Analytics API Routes

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Protected routes (admin only)
router.get('/daily', verifyToken, requireRole('administrator'), reportController.getDailySalesReport);
router.get('/weekly', verifyToken, requireRole('administrator'), reportController.getWeeklySalesReport);
router.get('/product-performance', verifyToken, requireRole('administrator'), reportController.getProductPerformanceReport);
router.get('/inventory-status', verifyToken, requireRole('administrator'), reportController.getInventoryStatusReport);
router.get('/cashier-performance', verifyToken, requireRole('administrator'), reportController.getCashierPerformanceReport);
router.get('/revenue-summary', verifyToken, requireRole('administrator'), reportController.getRevenueSummaryReport);
router.get('/top-products', verifyToken, requireRole('administrator'), reportController.getTopProductsReport);
router.get('/category-performance', verifyToken, requireRole('administrator'), reportController.getCategoryPerformanceReport);
router.get('/export', verifyToken, requireRole('administrator'), reportController.exportReport);

module.exports = router;
