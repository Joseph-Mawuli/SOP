// controllers/salesController.js
// Sales Processing Route Handlers

const salesService = require('../services/salesService');
const auditLogService = require('../services/auditLogService');
const { validateSalesData } = require('../middleware/validation');

// Create Sale
const createSale = async (req, res, next) => {
  try {
    const errors = validateSalesData(req.body);
    if (errors) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    const saleData = {
      ...req.body,
      cashier_id: req.user.user_id
    };

    const sale = await salesService.createSale(saleData);

    // Log audit trail
    try {
      await auditLogService.logAction({
        user_id: req.user.user_id,
        action: 'CREATE',
        entity_type: 'sale',
        entity_id: sale.sale_id,
        old_values: null,
        new_values: sale,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success'
      });
    } catch (auditError) {
      console.error('Audit logging error:', auditError);
    }

    res.status(201).json({
      success: true,
      message: 'Sale created successfully',
      data: sale
    });
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create sale'
    });
  }
};

// Get Sale by ID
const getSaleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const sale = await salesService.getSaleById(id);

    res.status(200).json({
      success: true,
      data: sale
    });
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Sale not found'
    });
  }
};

// Get All Sales
const getAllSales = async (req, res, next) => {
  try {
    const { cashier_id, customer_id, start_date, end_date } = req.query;

    const sales = await salesService.getAllSales({
      cashier_id,
      customer_id,
      start_date,
      end_date
    });

    res.status(200).json({
      success: true,
      count: sales.length,
      data: sales
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get sales'
    });
  }
};

// Get Daily Sales
const getDailySales = async (req, res, next) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    const sales = await salesService.getDailySales(date);

    res.status(200).json({
      success: true,
      count: sales.length,
      data: sales
    });
  } catch (error) {
    console.error('Get daily sales error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get daily sales'
    });
  }
};

// Get Daily Sales Summary
const getDailySalesSummary = async (req, res, next) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    const summary = await salesService.getDailySalesSummary(date);

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get daily sales summary error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get summary'
    });
  }
};

// Get Weekly Sales Summary
const getWeeklySalesSummary = async (req, res, next) => {
  try {
    const summary = await salesService.getWeeklySalesSummary();

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get weekly sales summary error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get summary'
    });
  }
};

// Get Cashier Performance
const getCashierPerformance = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const performance = await salesService.getCashierPerformance(start_date, end_date);

    res.status(200).json({
      success: true,
      count: performance.length,
      data: performance
    });
  } catch (error) {
    console.error('Get cashier performance error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get performance'
    });
  }
};

module.exports = {
  createSale,
  getSaleById,
  getAllSales,
  getDailySales,
  getDailySalesSummary,
  getWeeklySalesSummary,
  getCashierPerformance
};
