// routes/exportRoutes.js
// Data Export Routes

const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { verifyToken, requireRole } = require('../middleware/auth');

// All export routes require authentication and admin role
router.use(verifyToken);
router.use(requireRole('administrator'));

// Export reports
router.get('/sales', exportController.exportSalesReport);
router.get('/inventory', exportController.exportInventoryReport);
router.get('/customers', exportController.exportCustomerReport);
router.get('/product-performance', exportController.exportProductPerformance);

module.exports = router;
