// routes/inventoryRoutes.js
// Inventory Management API Routes

const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Protected routes (require authentication)
router.get('/', verifyToken, inventoryController.getAllInventory);
router.get('/stats', verifyToken, inventoryController.getInventoryStats);
router.get('/low-stock', verifyToken, inventoryController.getLowStockAlerts);
router.get('/product/:productId', verifyToken, inventoryController.getInventory);
router.get('/adjustments', verifyToken, inventoryController.getAdjustmentsHistory);

// Protected routes (admin/manager only)
router.post('/adjust', verifyToken, requireRole('administrator', 'manager'), inventoryController.adjustStock);

module.exports = router;
