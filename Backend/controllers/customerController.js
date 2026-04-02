// controllers/customerController.js
// Customer Management Route Handlers

const customerService = require('../services/customerService');
const auditLogService = require('../services/auditLogService');

// Register Customer
const registerCustomer = async (req, res, next) => {
  try {
    const { customer_name, phone, email, loyalty_points } = req.body;

    if (!customer_name) {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required'
      });
    }

    const customer = await customerService.registerCustomer({
      customer_name,
      phone,
      email,
      loyalty_points: loyalty_points ? parseInt(loyalty_points) : 0
    });

    // Log audit trail
    try {
      await auditLogService.logAction({
        user_id: req.user.user_id,
        action: 'CREATE',
        entity_type: 'customer',
        entity_id: customer.customer_id,
        old_values: null,
        new_values: customer,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success'
      });
    } catch (auditError) {
      console.error('Audit logging error:', auditError);
    }

    res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      data: customer
    });
  } catch (error) {
    console.error('Register customer error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
};

// Get All Customers
const getAllCustomers = async (req, res, next) => {
  try {
    const { search } = req.query;

    const customers = await customerService.getAllCustomers({ search });

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get customers'
    });
  }
};

// Get Customer by ID
const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const customer = await customerService.getCustomerById(id);

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Customer not found'
    });
  }
};

// Update Customer
const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const oldCustomer = await customerService.getCustomerById(id);

    const customer = await customerService.updateCustomer(id, req.body);

    // Log audit trail
    try {
      await auditLogService.logAction({
        user_id: req.user.user_id,
        action: 'UPDATE',
        entity_type: 'customer',
        entity_id: customer.customer_id,
        old_values: oldCustomer,
        new_values: customer,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success'
      });
    } catch (auditError) {
      console.error('Audit logging error:', auditError);
    }

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update customer'
    });
  }
};

// Add Loyalty Points
const addLoyaltyPoints = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { points } = req.body;

    if (!points || points <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid points value is required'
      });
    }

    const oldCustomer = await customerService.getCustomerById(id);
    const customer = await customerService.addLoyaltyPoints(id, points);

    // Log audit trail
    try {
      await auditLogService.logAction({
        user_id: req.user.user_id,
        action: 'UPDATE',
        entity_type: 'customer',
        entity_id: id,
        old_values: { loyalty_points: oldCustomer.loyalty_points },
        new_values: { loyalty_points: customer.loyalty_points },
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success'
      });
    } catch (auditError) {
      console.error('Audit logging error:', auditError);
    }

    res.status(200).json({
      success: true,
      message: 'Loyalty points added',
      data: customer
    });
  } catch (error) {
    console.error('Add loyalty points error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to add points'
    });
  }
};

// Get Purchase History
const getPurchaseHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const history = await customerService.getPurchaseHistory(id);

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    console.error('Get purchase history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get history'
    });
  }
};

// Get Customer Statistics
const getCustomerStats = async (req, res, next) => {
  try {
    const stats = await customerService.getCustomerStats();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get customer stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get statistics'
    });
  }
};

// Delete Customer
const deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;

    await customerService.deleteCustomer(id);

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete customer'
    });
  }
};

module.exports = {
  registerCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  addLoyaltyPoints,
  getPurchaseHistory,
  getCustomerStats,
  deleteCustomer
};
