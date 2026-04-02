// controllers/reportController.js
// Reporting and Analytics Route Handlers

const reportService = require('../services/reportService');

// Get Daily Sales Report
const getDailySalesReport = async (req, res, next) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    const report = await reportService.getDailySalesReport(date);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get daily report error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get report'
    });
  }
};

// Get Weekly Sales Report
const getWeeklySalesReport = async (req, res, next) => {
  try {
    const report = await reportService.getWeeklySalesReport();

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get weekly report error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get report'
    });
  }
};

// Get Product Performance Report
const getProductPerformanceReport = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const report = await reportService.getProductPerformanceReport(start_date, end_date);

    res.status(200).json({
      success: true,
      count: report.length,
      data: report
    });
  } catch (error) {
    console.error('Get product report error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get report'
    });
  }
};

// Get Inventory Status Report
const getInventoryStatusReport = async (req, res, next) => {
  try {
    const report = await reportService.getInventoryStatusReport();

    res.status(200).json({
      success: true,
      count: report.length,
      data: report
    });
  } catch (error) {
    console.error('Get inventory report error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get report'
    });
  }
};

// Get Cashier Performance Report
const getCashierPerformanceReport = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const report = await reportService.getCashierPerformanceReport(start_date, end_date);

    res.status(200).json({
      success: true,
      count: report.length,
      data: report
    });
  } catch (error) {
    console.error('Get cashier report error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get report'
    });
  }
};

// Get Revenue Summary Report
const getRevenueSummaryReport = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const report = await reportService.getRevenueSummaryReport(start_date, end_date);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get revenue report error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get report'
    });
  }
};

// Get Top Products Report
const getTopProductsReport = async (req, res, next) => {
  try {
    const { start_date, end_date, limit } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const report = await reportService.getTopProductsReport(start_date, end_date, limit || 10);

    res.status(200).json({
      success: true,
      count: report.length,
      data: report
    });
  } catch (error) {
    console.error('Get top products report error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get report'
    });
  }
};

// Get Category Performance Report
const getCategoryPerformanceReport = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const report = await reportService.getCategoryPerformanceReport(start_date, end_date);

    res.status(200).json({
      success: true,
      count: report.length,
      data: report
    });
  } catch (error) {
    console.error('Get category report error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get report'
    });
  }
};

// Export Report
const exportReport = async (req, res, next) => {
  try {
    const { reportType, start_date, end_date } = req.query;

    if (!reportType) {
      return res.status(400).json({
        success: false,
        message: 'Report type is required'
      });
    }

    const data = await reportService.exportReportData(reportType, start_date, end_date);

    // Set response headers for download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="report-${reportType}-${new Date().toISOString().split('T')[0]}.json"`);

    res.status(200).json(data);
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to export report'
    });
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
  exportReport
};
