// routes/customerRoutes.js
// Customer Management API Routes

const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { verifyToken } = require('../middleware/auth');

// Protected routes (require authentication)
router.post('/', verifyToken, customerController.registerCustomer);
router.get('/', verifyToken, customerController.getAllCustomers);
router.get('/stats', verifyToken, customerController.getCustomerStats);
// Static segments before `/:id` so `/history` is never captured as an id
router.get('/:id/history', verifyToken, customerController.getPurchaseHistory);
router.get('/:id', verifyToken, customerController.getCustomerById);
router.put('/:id', verifyToken, customerController.updateCustomer);
router.delete('/:id', verifyToken, customerController.deleteCustomer);
router.post('/:id/loyalty', verifyToken, customerController.addLoyaltyPoints);

module.exports = router;
