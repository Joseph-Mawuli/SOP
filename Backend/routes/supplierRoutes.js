// routes/supplierRoutes.js
// Supplier Management Routes

const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { verifyToken, requireRole } = require('../middleware/auth');

// All supplier routes require authentication and admin role
router.use(verifyToken);
router.use(requireRole('administrator'));

// Supplier CRUD
router.post('/', supplierController.createSupplier);
router.get('/', supplierController.getAllSuppliers);
router.get('/:id', supplierController.getSupplierById);
router.put('/:id', supplierController.updateSupplier);
router.delete('/:id', supplierController.deleteSupplier);

// Product-Supplier linking
router.post('/link', supplierController.linkProductToSupplier);
router.get('/product/:product_id', supplierController.getProductSuppliers);

module.exports = router;
