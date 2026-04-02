// routes/productRoutes.js
// Product Management API Routes

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Public routes (read-only)
router.get('/', productController.getAllProducts);
router.get('/categories', productController.getCategories);
router.get('/search', productController.searchProducts);
router.get('/category/:category', productController.getProductsByCategory);
router.get('/barcode/:barcode', productController.getProductByBarcode);
router.get('/:id', productController.getProductById);

// Protected routes (admin/manager only)
router.post('/', verifyToken, requireRole('administrator', 'manager'), productController.createProduct);
router.put('/:id', verifyToken, requireRole('administrator', 'manager'), productController.updateProduct);
router.delete('/:id', verifyToken, requireRole('administrator', 'manager'), productController.deleteProduct);

module.exports = router;
