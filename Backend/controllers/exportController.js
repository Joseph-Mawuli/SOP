// controllers/exportController.js
// Data Export Route Handlers

const exportService = require('../services/exportService');

// Export sales report
const exportSalesReport = async (req, res, next) => {
  try {
    const { start_date, end_date, format = 'csv' } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const data = await exportService.exportSalesReport(start_date, end_date);

    if (format === 'json') {
      const jsonData = exportService.convertToJSON(data);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="sales_report.json"');
      res.send(jsonData);
    } else {
      const csvData = exportService.convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="sales_report.csv"');
      res.send(csvData);
    }
  } catch (error) {
    console.error('Export sales error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to export sales report'
    });
  }
};

// Export inventory report
const exportInventoryReport = async (req, res, next) => {
  try {
    const { format = 'csv' } = req.query;

    const data = await exportService.exportInventoryReport();

    if (format === 'json') {
      const jsonData = exportService.convertToJSON(data);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="inventory_report.json"');
      res.send(jsonData);
    } else {
      const csvData = exportService.convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="inventory_report.csv"');
      res.send(csvData);
    }
  } catch (error) {
    console.error('Export inventory error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to export inventory report'
    });
  }
};

// Export customer report
const exportCustomerReport = async (req, res, next) => {
  try {
    const { format = 'csv' } = req.query;

    const data = await exportService.exportCustomerReport();

    if (format === 'json') {
      const jsonData = exportService.convertToJSON(data);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="customer_report.json"');
      res.send(jsonData);
    } else {
      const csvData = exportService.convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="customer_report.csv"');
      res.send(csvData);
    }
  } catch (error) {
    console.error('Export customer error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to export customer report'
    });
  }
};

// Export product performance report
const exportProductPerformance = async (req, res, next) => {
  try {
    const { start_date, end_date, format = 'csv' } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const data = await exportService.exportProductPerformance(start_date, end_date);

    if (format === 'json') {
      const jsonData = exportService.convertToJSON(data);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="product_performance.json"');
      res.send(jsonData);
    } else {
      const csvData = exportService.convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="product_performance.csv"');
      res.send(csvData);
    }
  } catch (error) {
    console.error('Export product performance error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to export product performance'
    });
  }
};

module.exports = {
  exportSalesReport,
  exportInventoryReport,
  exportCustomerReport,
  exportProductPerformance
};
