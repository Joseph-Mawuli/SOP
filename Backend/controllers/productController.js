// controllers/productController.js
// Product Management Route Handlers

const productService = require('../services/productService');
const auditLogService = require('../services/auditLogService');
const { validateProductData } = require('../middleware/validation');

// Create Product
const createProduct = async (req, res, next) => {
  try {
    const errors = validateProductData(req.body);
    if (errors) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    const product = await productService.createProduct(req.body, req.user.user_id);

    // Log audit trail
    try {
      await auditLogService.logAction({
        user_id: req.user.user_id,
        action: 'CREATE',
        entity_type: 'product',
        entity_id: product.product_id,
        old_values: null,
        new_values: product,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success'
      });
    } catch (auditError) {
      console.error('Audit logging error:', auditError);
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create product'
    });
  }
};

// Get All Products
const getAllProducts = async (req, res, next) => {
  try {
    const { category, search } = req.query;

    const products = await productService.getAllProducts({
      category,
      search
    });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get products'
    });
  }
};

// Get Product by ID
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await productService.getProductById(id);

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Product not found'
    });
  }
};

// Get Product by Barcode
const getProductByBarcode = async (req, res, next) => {
  try {
    const { barcode } = req.params;

    const product = await productService.getProductByBarcode(barcode);

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product by barcode error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Product not found'
    });
  }
};

// Update Product
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const oldProduct = await productService.getProductById(id);

    const product = await productService.updateProduct(id, req.body);

    // Log audit trail
    try {
      await auditLogService.logAction({
        user_id: req.user.user_id,
        action: 'UPDATE',
        entity_type: 'product',
        entity_id: product.product_id,
        old_values: oldProduct,
        new_values: product,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success'
      });
    } catch (auditError) {
      console.error('Audit logging error:', auditError);
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update product'
    });
  }
};

// Delete Product
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedProduct = await productService.getProductById(id);

    await productService.deleteProduct(id);

    // Log audit trail
    try {
      await auditLogService.logAction({
        user_id: req.user.user_id,
        action: 'DELETE',
        entity_type: 'product',
        entity_id: id,
        old_values: deletedProduct,
        new_values: null,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success'
      });
    } catch (auditError) {
      console.error('Audit logging error:', auditError);
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete product'
    });
  }
};

// Get Products by Category
const getProductsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;

    const products = await productService.getProductsByCategory(category);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get products'
    });
  }
};

// Search Products
const searchProducts = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const products = await productService.searchProducts(query);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search products'
    });
  }
};

// Get Categories
const getCategories = async (req, res, next) => {
  try {
    const categories = await productService.getCategories();

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get categories'
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  getProductByBarcode,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  searchProducts,
  getCategories
};
