// services/productService.js
// Product Management Business Logic

const { query } = require('../config/database');
const { sanitizeString, validateDecimal } = require('../middleware/validation');

// Create Product
const createProduct = async (productData, userId) => {
  try {
    const result = await query(
      `INSERT INTO products (product_name, barcode, category, description, unit_price, cost_price, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        sanitizeString(productData.product_name),
        productData.barcode ? sanitizeString(productData.barcode) : null,
        sanitizeString(productData.category),
        productData.description ? sanitizeString(productData.description) : null,
        productData.unit_price,
        productData.cost_price || null,
        userId
      ]
    );

    const product = result.rows[0];

    // Create inventory record
    await query(
      `INSERT INTO inventory (product_id, quantity_on_hand, reorder_level, reorder_quantity)
       VALUES ($1, $2, $3, $4)`,
      [product.product_id, 0, 10, 50]
    );

    return product;
  } catch (error) {
    throw error;
  }
};

// Get All Products
const getAllProducts = async (filters = {}) => {
  try {
    let whereClause = 'WHERE is_active = true';
    const params = [];
    let paramCount = 1;

    if (filters.category) {
      whereClause += ` AND category = $${paramCount}`;
      params.push(filters.category);
      paramCount++;
    }

    if (filters.search) {
      whereClause += ` AND (product_name ILIKE $${paramCount} OR barcode ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    const result = await query(
      `SELECT p.*, i.quantity_on_hand, i.reorder_level 
       FROM products p
       LEFT JOIN inventory i ON p.product_id = i.product_id
       ${whereClause}
       ORDER BY p.created_at DESC`,
      params
    );

    return result.rows;
  } catch (error) {
    throw error;
  }
};

// Get Product by ID
const getProductById = async (productId) => {
  try {
    const result = await query(
      `SELECT p.*, i.quantity_on_hand, i.reorder_level 
       FROM products p
       LEFT JOIN inventory i ON p.product_id = i.product_id
       WHERE p.product_id = $1`,
      [productId]
    );

    if (result.rows.length === 0) {
      throw { message: 'Product not found' };
    }

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Get Product by Barcode
const getProductByBarcode = async (barcode) => {
  try {
    const result = await query(
      `SELECT p.*, i.quantity_on_hand, i.reorder_level 
       FROM products p
       LEFT JOIN inventory i ON p.product_id = i.product_id
       WHERE p.barcode = $1 AND p.is_active = true`,
      [barcode]
    );

    if (result.rows.length === 0) {
      throw { message: 'Product not found' };
    }

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Update Product
const updateProduct = async (productId, updateData) => {
  try {
    const result = await query(
      `UPDATE products 
       SET product_name = COALESCE($1, product_name),
           barcode = COALESCE($2, barcode),
           category = COALESCE($3, category),
           description = COALESCE($4, description),
           unit_price = COALESCE($5, unit_price),
           cost_price = COALESCE($6, cost_price),
           updated_at = CURRENT_TIMESTAMP
       WHERE product_id = $7
       RETURNING *`,
      [
        updateData.product_name ? sanitizeString(updateData.product_name) : null,
        updateData.barcode ? sanitizeString(updateData.barcode) : null,
        updateData.category ? sanitizeString(updateData.category) : null,
        updateData.description ? sanitizeString(updateData.description) : null,
        updateData.unit_price || null,
        updateData.cost_price || null,
        productId
      ]
    );

    if (result.rows.length === 0) {
      throw { message: 'Product not found' };
    }

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Delete Product (Soft Delete)
const deleteProduct = async (productId) => {
  try {
    const result = await query(
      `UPDATE products 
       SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE product_id = $1
       RETURNING *`,
      [productId]
    );

    if (result.rows.length === 0) {
      throw { message: 'Product not found' };
    }

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Get Products by Category
const getProductsByCategory = async (category) => {
  try {
    const result = await query(
      `SELECT p.*, i.quantity_on_hand, i.reorder_level 
       FROM products p
       LEFT JOIN inventory i ON p.product_id = i.product_id
       WHERE p.category = $1 AND p.is_active = true
       ORDER BY p.product_name`,
      [category]
    );

    return result.rows;
  } catch (error) {
    throw error;
  }
};

// Search Products
const searchProducts = async (searchTerm) => {
  try {
    const result = await query(
      `SELECT p.*, i.quantity_on_hand, i.reorder_level 
       FROM products p
       LEFT JOIN inventory i ON p.product_id = i.product_id
       WHERE (p.product_name ILIKE $1 OR p.barcode ILIKE $1) AND p.is_active = true
       ORDER BY p.product_name`,
      [`%${searchTerm}%`]
    );

    return result.rows;
  } catch (error) {
    throw error;
  }
};

// Get All Categories
const getCategories = async () => {
  try {
    const result = await query(
      'SELECT DISTINCT category FROM products WHERE is_active = true ORDER BY category'
    );

    return result.rows.map(row => row.category);
  } catch (error) {
    throw error;
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
