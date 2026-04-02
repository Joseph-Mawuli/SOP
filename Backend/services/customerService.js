// services/customerService.js
// Customer Management Business Logic

const { query } = require('../config/database');
const { sanitizeString, validateEmail } = require('../middleware/validation');

// Register Customer
const registerCustomer = async (customerData) => {
  try {
    // Validate email if provided
    if (customerData.email && !validateEmail(customerData.email)) {
      throw { message: 'Invalid email format' };
    }

    const result = await query(
      `INSERT INTO customers (customer_name, phone, email, loyalty_points, is_registered)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [
        sanitizeString(customerData.customer_name),
        customerData.phone ? sanitizeString(customerData.phone) : null,
        customerData.email ? customerData.email.toLowerCase() : null,
        customerData.loyalty_points || 0
      ]
    );

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Get All Customers
const getAllCustomers = async (filters = {}) => {
  try {
    let query_text = 'SELECT * FROM customers WHERE is_registered = true';
    const params = [];
    let paramCount = 1;

    if (filters.search) {
      query_text += ` AND (customer_name ILIKE $${paramCount} OR email = $${paramCount} OR phone = $${paramCount})`;
      params.push(`%${filters.search}%`, filters.search, filters.search);
      paramCount += 3;
    }

    query_text += ' ORDER BY customer_name';

    const result = await query(query_text, params);
    return result.rows;
  } catch (error) {
    throw error;
  }
};

// Get Customer by ID
const getCustomerById = async (customerId) => {
  try {
    const result = await query(
      'SELECT * FROM customers WHERE customer_id = $1',
      [customerId]
    );

    if (result.rows.length === 0) {
      throw { message: 'Customer not found' };
    }

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Get Customer by Email
const getCustomerByEmail = async (email) => {
  try {
    const result = await query(
      'SELECT * FROM customers WHERE email = $1 AND is_registered = true',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Update Customer
const updateCustomer = async (customerId, updateData) => {
  try {
    const result = await query(
      `UPDATE customers 
       SET customer_name = COALESCE($1, customer_name),
           phone = COALESCE($2, phone),
           email = COALESCE($3, email),
           updated_at = CURRENT_TIMESTAMP
       WHERE customer_id = $4
       RETURNING *`,
      [
        updateData.customer_name ? sanitizeString(updateData.customer_name) : null,
        updateData.phone ? sanitizeString(updateData.phone) : null,
        updateData.email ? updateData.email.toLowerCase() : null,
        customerId
      ]
    );

    if (result.rows.length === 0) {
      throw { message: 'Customer not found' };
    }

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Add Loyalty Points
const addLoyaltyPoints = async (customerId, points) => {
  try {
    const result = await query(
      `UPDATE customers 
       SET loyalty_points = loyalty_points + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE customer_id = $2
       RETURNING *`,
      [points, customerId]
    );

    if (result.rows.length === 0) {
      throw { message: 'Customer not found' };
    }

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Deduct Loyalty Points
const deductLoyaltyPoints = async (customerId, points) => {
  try {
    const customerResult = await query(
      'SELECT loyalty_points FROM customers WHERE customer_id = $1',
      [customerId]
    );

    if (customerResult.rows.length === 0) {
      throw { message: 'Customer not found' };
    }

    if (customerResult.rows[0].loyalty_points < points) {
      throw { message: 'Insufficient loyalty points' };
    }

    const result = await query(
      `UPDATE customers 
       SET loyalty_points = loyalty_points - $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE customer_id = $2
       RETURNING *`,
      [points, customerId]
    );

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Update Total Purchases
const updateTotalPurchases = async (customerId, amount) => {
  try {
    const result = await query(
      `UPDATE customers 
       SET total_purchases = total_purchases + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE customer_id = $2
       RETURNING *`,
      [amount, customerId]
    );

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Get Customer Purchase History
const getPurchaseHistory = async (customerId) => {
  try {
    const result = await query(
      `SELECT s.*,
              u.username AS cashier_name,
              (SELECT COUNT(*)::int FROM sales_items si WHERE si.sale_id = s.sale_id) AS item_count
       FROM sales s
       LEFT JOIN users u ON s.cashier_id = u.user_id
       WHERE s.customer_id = $1
       ORDER BY s.created_at DESC`,
      [customerId]
    );

    return result.rows;
  } catch (error) {
    throw error;
  }
};

// Get Customer Statistics
const getCustomerStats = async () => {
  try {
    const result = await query(
      `SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN total_purchases > 0 THEN 1 END) as active_customers,
        ROUND(AVG(total_purchases)::numeric, 2) as avg_purchase_value,
        ROUND(SUM(total_purchases)::numeric, 2) as total_revenue
       FROM customers
       WHERE is_registered = true`
    );

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Delete Customer
const deleteCustomer = async (customerId) => {
  try {
    const result = await query(
      'DELETE FROM customers WHERE customer_id = $1 RETURNING *',
      [customerId]
    );

    if (result.rows.length === 0) {
      throw { message: 'Customer not found' };
    }

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

module.exports = {
  registerCustomer,
  getAllCustomers,
  getCustomerById,
  getCustomerByEmail,
  updateCustomer,
  addLoyaltyPoints,
  deductLoyaltyPoints,
  updateTotalPurchases,
  getPurchaseHistory,
  getCustomerStats,
  deleteCustomer
};
