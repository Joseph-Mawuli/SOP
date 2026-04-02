// services/reportService.js
// Reporting and Analytics Business Logic

const { query } = require("../config/database");

// Get Daily Sales Report
const getDailySalesReport = async (date) => {
 try {
  const salesSummary = await query(
   `SELECT 
        COUNT(*) as total_transactions,
        SUM(subtotal) as subtotal,
        SUM(discount_amount) as total_discounts,
        SUM(tax_amount) as total_tax,
        SUM(total_amount) as total_revenue,
        COUNT(DISTINCT customer_id) as unique_customers
       FROM sales
       WHERE DATE(created_at) = $1`,
   [date],
  );

  const sales = await query(
   `SELECT 
        s.sale_id, s.transaction_id, s.created_at,
        u.username as cashier_name,
        c.customer_name,
        s.total_amount,
        COUNT(si.sale_item_id) as item_count
       FROM sales s
       LEFT JOIN users u ON s.cashier_id = u.user_id
       LEFT JOIN customers c ON s.customer_id = c.customer_id
       LEFT JOIN sales_items si ON s.sale_id = si.sale_id
       WHERE DATE(s.created_at) = $1
       GROUP BY s.sale_id, u.username, c.customer_name
       ORDER BY s.created_at DESC`,
   [date],
  );

  return {
   summary: salesSummary.rows[0],
   transactions: sales.rows,
  };
 } catch (error) {
  throw error;
 }
};

// Get Weekly Sales Report
const getWeeklySalesReport = async () => {
 try {
  const result = await query(
   `SELECT 
        DATE(created_at) as sale_date,
        COUNT(*) as transaction_count,
        SUM(subtotal) as subtotal,
        SUM(discount_amount) as discounts,
        SUM(tax_amount) as tax,
        SUM(total_amount) as total_sales
       FROM sales
       WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at) DESC`,
  );

  return result.rows;
 } catch (error) {
  throw error;
 }
};

// Get Product Performance Report
const getProductPerformanceReport = async (startDate, endDate) => {
 try {
  const result = await query(
   `SELECT 
        p.product_id,
        p.product_name,
        p.category,
        p.unit_price,
        SUM(si.quantity) as total_quantity_sold,
        SUM(si.item_total) as total_revenue,
        COUNT(DISTINCT si.sale_id) as transaction_count,
        ROUND(AVG(si.quantity)::numeric, 2) as avg_quantity_per_sale
       FROM products p
       LEFT JOIN sales_items si ON p.product_id = si.product_id
       LEFT JOIN sales s ON si.sale_id = s.sale_id
       WHERE s.created_at IS NULL OR (s.created_at >= $1::date AND s.created_at < $2::date + INTERVAL '1 day')
       GROUP BY p.product_id, p.product_name, p.category, p.unit_price
       HAVING SUM(si.quantity) > 0
       ORDER BY total_revenue DESC`,
   [startDate, endDate],
  );

  return result.rows;
 } catch (error) {
  throw error;
 }
};

// Get Inventory Status Report
const getInventoryStatusReport = async () => {
 try {
  const result = await query(
   `SELECT 
        i.inventory_id,
        p.product_id,
        p.product_name,
        p.category,
        p.unit_price,
        i.quantity_on_hand,
        i.reorder_level,
        i.reorder_quantity,
        (i.quantity_on_hand * p.unit_price) as stock_value,
        CASE 
          WHEN i.quantity_on_hand = 0 THEN 'Out of Stock'
          WHEN i.quantity_on_hand <= i.reorder_level THEN 'Low Stock Alert'
          ELSE 'OK'
        END as stock_status
       FROM inventory i
       JOIN products p ON i.product_id = p.product_id
       WHERE p.is_active = true
       ORDER BY stock_status DESC, p.product_name`,
  );

  return result.rows;
 } catch (error) {
  throw error;
 }
};

// Get Cashier Performance Report
const getCashierPerformanceReport = async (startDate, endDate) => {
 try {
  const result = await query(
   `SELECT 
        u.user_id,
        u.username,
        u.first_name,
        u.last_name,
        COUNT(s.sale_id) as transaction_count,
        COALESCE(SUM(s.total_amount), 0) as total_sales,
        ROUND(COALESCE(AVG(s.total_amount), 0)::numeric, 2) as avg_transaction_value,
        COALESCE(SUM(s.discount_amount), 0) as total_discounts
       FROM users u
       LEFT JOIN sales s ON u.user_id = s.cashier_id 
          AND DATE(s.created_at) >= $1::date 
          AND DATE(s.created_at) <= $2::date
       WHERE u.role = 'cashier' AND u.is_active = true
       GROUP BY u.user_id, u.username, u.first_name, u.last_name
       ORDER BY COALESCE(SUM(s.total_amount), 0) DESC`,
   [startDate, endDate],
  );

  return result.rows;
 } catch (error) {
  throw error;
 }
};

// Get Revenue Summary Report
const getRevenueSummaryReport = async (startDate, endDate) => {
 try {
  const result = await query(
   `SELECT 
        COUNT(*) as total_transactions,
        COUNT(DISTINCT customer_id) as unique_customers,
        SUM(subtotal) as subtotal,
        SUM(discount_amount) as total_discounts,
        SUM(tax_amount) as total_tax,
        SUM(total_amount) as total_revenue,
        ROUND(AVG(total_amount)::numeric, 2) as avg_transaction_value,
        MIN(created_at) as first_sale,
        MAX(created_at) as last_sale
       FROM sales
       WHERE created_at >= $1::date AND created_at < $2::date + INTERVAL '1 day'`,
   [startDate, endDate],
  );

  return result.rows[0];
 } catch (error) {
  throw error;
 }
};

// Get Top Products Report
const getTopProductsReport = async (startDate, endDate, limit = 10) => {
 try {
  const result = await query(
   `SELECT 
        p.product_id,
        p.product_name,
        p.category,
        p.unit_price,
        SUM(si.quantity) as total_quantity_sold,
        SUM(si.item_total) as total_revenue,
        RANK() OVER (ORDER BY SUM(si.item_total) DESC) as rank
       FROM products p
       JOIN sales_items si ON p.product_id = si.product_id
       JOIN sales s ON si.sale_id = s.sale_id
       WHERE s.created_at >= $1::date AND s.created_at < $2::date + INTERVAL '1 day'
       GROUP BY p.product_id, p.product_name, p.category, p.unit_price
       ORDER BY total_revenue DESC
       LIMIT $3`,
   [startDate, endDate, limit],
  );

  return result.rows;
 } catch (error) {
  throw error;
 }
};

// Get Category Performance Report
const getCategoryPerformanceReport = async (startDate, endDate) => {
 try {
  const result = await query(
   `SELECT 
        p.category,
        COUNT(DISTINCT p.product_id) as product_count,
        SUM(si.quantity) as total_quantity_sold,
        SUM(si.item_total) as total_revenue,
        COUNT(DISTINCT si.sale_id) as transaction_count
       FROM products p
       LEFT JOIN sales_items si ON p.product_id = si.product_id
       LEFT JOIN sales s ON si.sale_id = s.sale_id
       WHERE p.is_active = true AND (s.created_at IS NULL OR (s.created_at >= $1::date AND s.created_at < $2::date + INTERVAL '1 day'))
       GROUP BY p.category
       ORDER BY total_revenue DESC`,
   [startDate, endDate],
  );

  return result.rows;
 } catch (error) {
  throw error;
 }
};

// Export Report to JSON
const exportReportData = async (reportType, startDate, endDate) => {
 try {
  let data;

  switch (reportType) {
   case "daily":
    data = await getDailySalesReport(startDate);
    break;
   case "weekly":
    data = await getWeeklySalesReport();
    break;
   case "product":
    data = await getProductPerformanceReport(startDate, endDate);
    break;
   case "inventory":
    data = await getInventoryStatusReport();
    break;
   case "cashier":
    data = await getCashierPerformanceReport(startDate, endDate);
    break;
   case "revenue":
    data = await getRevenueSummaryReport(startDate, endDate);
    break;
   default:
    throw { message: "Invalid report type" };
  }

  return {
   reportType,
   generatedAt: new Date().toISOString(),
   data,
  };
 } catch (error) {
  throw error;
 }
};

module.exports = {
 getDailySalesReport,
 getWeeklySalesReport,
 getProductPerformanceReport,
 getInventoryStatusReport,
 getCashierPerformanceReport,
 getRevenueSummaryReport,
 getTopProductsReport,
 getCategoryPerformanceReport,
 exportReportData,
};
