// services/exportService.js
// Data Export Service for CSV/JSON Export

const { query } = require('../config/database');
const { createObjectCsvWriter } = require('csv-writer');
const path = require('path');
const fs = require('fs').promises;

// Export sales data to CSV
const exportSalesReport = async (start_date, end_date) => {
  try {
    const result = await query(
      `SELECT 
        s.sale_id,
        s.transaction_id,
        TO_CHAR(s.created_at, 'YYYY-MM-DD HH:MI:SS') as sale_date,
        u.username as cashier,
        c.customer_name,
        s.subtotal,
        s.discount_amount,
        s.tax_amount,
        s.total_amount,
        p.payment_method,
        s.sale_status
      FROM sales s
      JOIN users u ON s.cashier_id = u.user_id
      LEFT JOIN customers c ON s.customer_id = c.customer_id
      LEFT JOIN payments p ON s.sale_id = p.sale_id
      WHERE s.created_at BETWEEN $1 AND $2
      ORDER BY s.created_at DESC`,
      [start_date, end_date]
    );

    return result.rows;
  } catch (error) {
    console.error('Export sales error:', error);
    throw error;
  }
};

// Export inventory data to CSV
const exportInventoryReport = async () => {
  try {
    const result = await query(
      `SELECT 
        p.product_id,
        p.product_name,
        p.barcode,
        p.category,
        p.unit_price,
        i.quantity_on_hand,
        i.reorder_level,
        i.reorder_quantity,
        CASE 
          WHEN i.quantity_on_hand <= i.reorder_level THEN 'LOW'
          ELSE 'OK'
        END as stock_status
      FROM products p
      LEFT JOIN inventory i ON p.product_id = i.product_id
      WHERE p.is_active = true
      ORDER BY p.product_name`
    );

    return result.rows;
  } catch (error) {
    console.error('Export inventory error:', error);
    throw error;
  }
};

// Export customer data to CSV
const exportCustomerReport = async () => {
  try {
    const result = await query(
      `SELECT 
        customer_id,
        customer_name,
        phone,
        email,
        loyalty_points,
        total_purchases,
        TO_CHAR(registered_at, 'YYYY-MM-DD') as registration_date
      FROM customers
      WHERE is_registered = true
      ORDER BY registered_at DESC`
    );

    return result.rows;
  } catch (error) {
    console.error('Export customer error:', error);
    throw error;
  }
};

// Export product performance data
const exportProductPerformance = async (start_date, end_date) => {
  try {
    const result = await query(
      `SELECT 
        p.product_id,
        p.product_name,
        p.category,
        COUNT(si.sale_item_id) as times_sold,
        SUM(si.quantity) as total_quantity,
        SUM(si.item_total) as total_revenue,
        ROUND(AVG(p.unit_price), 2) as avg_price
      FROM products p
      LEFT JOIN sales_items si ON p.product_id = si.product_id
      LEFT JOIN sales s ON si.sale_id = s.sale_id
      WHERE s.created_at BETWEEN $1 AND $2
      GROUP BY p.product_id, p.product_name, p.category
      ORDER BY total_revenue DESC`,
      [start_date, end_date]
    );

    return result.rows;
  } catch (error) {
    console.error('Export product performance error:', error);
    throw error;
  }
};

// Convert array of objects to CSV string
const convertToCSV = (data) => {
  if (!data || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header =>
        JSON.stringify(row[header] === null || row[header] === undefined ? '' : row[header])
      ).join(',')
    )
  ].join('\n');

  return csvContent;
};

// Convert array of objects to JSON string
const convertToJSON = (data) => {
  return JSON.stringify(data, null, 2);
};

module.exports = {
  exportSalesReport,
  exportInventoryReport,
  exportCustomerReport,
  exportProductPerformance,
  convertToCSV,
  convertToJSON,
};
