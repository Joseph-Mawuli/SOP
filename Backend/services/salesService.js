// services/salesService.js
// Sales Processing Business Logic

const { query } = require('../config/database');
const inventoryService = require('./inventoryService');

// Generate Transaction ID
const generateTransactionId = () => {
  const date = new Date();
  const timestamp = date.getTime().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TXN${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}${timestamp}${random}`;
};

// Create Sale
const createSale = async (saleData) => {
  const client = await require('../config/database').getClient();

  try {
    await client.query('BEGIN');

    // Validate items
    if (!saleData.items || saleData.items.length === 0) {
      throw { message: 'Sale must have at least one item' };
    }

    // Check stock availability for all items
    for (const item of saleData.items) {
      const stockCheck = await inventoryService.checkStockAvailability(item.product_id, item.quantity);
      if (!stockCheck.available) {
        throw { message: `Insufficient stock for product ID ${item.product_id}` };
      }
    }

    // Generate transaction ID
    const transactionId = generateTransactionId();

    // Calculate totals
    let subtotal = 0;
    for (const item of saleData.items) {
      subtotal += item.quantity * item.unit_price;
    }

    const discountAmount = saleData.discount_amount || 0;
    const taxAmount = (subtotal - discountAmount) * saleData.tax_rate || 0;
    const totalAmount = subtotal - discountAmount + taxAmount;

    // Create sale
    const saleResult = await client.query(
      `INSERT INTO sales (transaction_id, cashier_id, customer_id, subtotal, discount_amount, tax_amount, total_amount, sale_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed')
       RETURNING *`,
      [transactionId, saleData.cashier_id, saleData.customer_id || null, subtotal, discountAmount, taxAmount, totalAmount]
    );

    const sale = saleResult.rows[0];

    // Create sale items and deduct inventory
    for (const item of saleData.items) {
      await client.query(
        `INSERT INTO sales_items (sale_id, product_id, quantity, unit_price, item_total)
         VALUES ($1, $2, $3, $4, $5)`,
        [sale.sale_id, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price]
      );

      // Deduct from inventory
      await client.query(
        `UPDATE inventory 
         SET quantity_on_hand = quantity_on_hand - $1,
             last_updated = CURRENT_TIMESTAMP
         WHERE product_id = $2`,
        [item.quantity, item.product_id]
      );
    }

    // Update customer spend for registered customers linked to this sale
    if (sale.customer_id) {
      await client.query(
        `UPDATE customers
         SET total_purchases = total_purchases + $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE customer_id = $2`,
        [totalAmount, sale.customer_id]
      );
    }

    await client.query('COMMIT');
    return sale;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Get Sale by ID
const getSaleById = async (saleId) => {
  try {
    const saleResult = await query(
      'SELECT * FROM sales WHERE sale_id = $1',
      [saleId]
    );

    if (saleResult.rows.length === 0) {
      throw { message: 'Sale not found' };
    }

    const sale = saleResult.rows[0];

    // Get sale items
    const itemsResult = await query(
      `SELECT si.*, p.product_name, p.barcode, p.category
       FROM sales_items si
       JOIN products p ON si.product_id = p.product_id
       WHERE si.sale_id = $1`,
      [saleId]
    );

    sale.items = itemsResult.rows;

    // Get payment info
    const paymentResult = await query(
      'SELECT * FROM payments WHERE sale_id = $1',
      [saleId]
    );

    if (paymentResult.rows.length > 0) {
      sale.payment = paymentResult.rows[0];
    }

    return sale;
  } catch (error) {
    throw error;
  }
};

// Get All Sales
const getAllSales = async (filters = {}) => {
  try {
    let query_text = 'SELECT s.* FROM sales s WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.cashier_id) {
      query_text += ` AND s.cashier_id = $${paramCount}`;
      params.push(filters.cashier_id);
      paramCount++;
    }

    if (filters.customer_id) {
      query_text += ` AND s.customer_id = $${paramCount}`;
      params.push(filters.customer_id);
      paramCount++;
    }

    if (filters.start_date) {
      query_text += ` AND s.created_at >= $${paramCount}::date`;
      params.push(filters.start_date);
      paramCount++;
    }

    if (filters.end_date) {
      query_text += ` AND s.created_at <= $${paramCount}::date + INTERVAL '1 day'`;
      params.push(filters.end_date);
      paramCount++;
    }

    query_text += ' ORDER BY s.created_at DESC';

    const result = await query(query_text, params);
    return result.rows;
  } catch (error) {
    throw error;
  }
};

// Get Daily Sales
const getDailySales = async (date) => {
  try {
    const result = await query(
      `SELECT * FROM sales 
       WHERE DATE(created_at) = $1
       ORDER BY created_at DESC`,
      [date]
    );

    return result.rows;
  } catch (error) {
    throw error;
  }
};

// Get Daily Sales Summary
const getDailySalesSummary = async (date) => {
  try {
    const result = await query(
      `SELECT 
        COUNT(*) as total_transactions,
        SUM(subtotal) as total_subtotal,
        SUM(discount_amount) as total_discounts,
        SUM(tax_amount) as total_tax,
        SUM(total_amount) as total_sales,
        COUNT(DISTINCT customer_id) as unique_customers
       FROM sales
       WHERE DATE(created_at) = $1`,
      [date]
    );

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Get Weekly Sales Summary
const getWeeklySalesSummary = async () => {
  try {
    const result = await query(
      `SELECT 
        DATE(created_at) as sale_date,
        COUNT(*) as transaction_count,
        SUM(total_amount) as daily_total
       FROM sales
       WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at) DESC`
    );

    return result.rows;
  } catch (error) {
    throw error;
  }
};

// Get Cashier Performance
const getCashierPerformance = async (startDate, endDate) => {
  try {
    const result = await query(
      `SELECT 
        u.user_id,
        u.username,
        COUNT(s.sale_id) as total_transactions,
        SUM(s.total_amount) as total_sales,
        ROUND(AVG(s.total_amount)::numeric, 2) as avg_transaction_value
       FROM users u
       LEFT JOIN sales s ON u.user_id = s.cashier_id 
          AND s.created_at >= $1::date 
          AND s.created_at < $2::date + INTERVAL '1 day'
       WHERE u.role = 'cashier'
       GROUP BY u.user_id, u.username
       ORDER BY total_sales DESC`,
      [startDate, endDate]
    );

    return result.rows;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createSale,
  getSaleById,
  getAllSales,
  getDailySales,
  getDailySalesSummary,
  getWeeklySalesSummary,
  getCashierPerformance,
  generateTransactionId
};
