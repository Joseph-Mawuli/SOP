// controllers/supplierController.js
// Supplier Management Route Handlers

const supplierService = require('../services/supplierService');
const { validateSupplierData } = require('../middleware/validation');

// Create Supplier
const createSupplier = async (req, res, next) => {
  try {
    const errors = validateSupplierData(req.body);
    if (errors) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    const supplier = await supplierService.createSupplier(req.body);

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: supplier
    });
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create supplier'
    });
  }
};

// Get All Suppliers
const getAllSuppliers = async (req, res, next) => {
  try {
    const { search } = req.query;

    const suppliers = await supplierService.getAllSuppliers({ search });

    res.status(200).json({
      success: true,
      count: suppliers.length,
      data: suppliers
    });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get suppliers'
    });
  }
};

// Get Supplier By ID
const getSupplierById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const supplier = await supplierService.getSupplierById(id);

    res.status(200).json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Supplier not found'
    });
  }
};

// Update Supplier
const updateSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;

    const supplier = await supplierService.updateSupplier(id, req.body);

    res.status(200).json({
      success: true,
      message: 'Supplier updated successfully',
      data: supplier
    });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update supplier'
    });
  }
};

// Delete Supplier
const deleteSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;

    await supplierService.deleteSupplier(id);

    res.status(200).json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete supplier'
    });
  }
};

// Link supplier to product
const linkProductToSupplier = async (req, res, next) => {
  try {
    const { product_id, supplier_id, supplier_sku, supplier_unit_price, lead_time_days } = req.body;

    if (!product_id || !supplier_id) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and Supplier ID are required'
      });
    }

    const link = await supplierService.linkProductToSupplier({
      product_id,
      supplier_id,
      supplier_sku,
      supplier_unit_price,
      lead_time_days
    });

    res.status(201).json({
      success: true,
      message: 'Product linked to supplier successfully',
      data: link
    });
  } catch (error) {
    console.error('Link product to supplier error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to link product to supplier'
    });
  }
};

// Get suppliers for a product
const getProductSuppliers = async (req, res, next) => {
  try {
    const { product_id } = req.params;

    const suppliers = await supplierService.getProductSuppliers(product_id);

    res.status(200).json({
      success: true,
      count: suppliers.length,
      data: suppliers
    });
  } catch (error) {
    console.error('Get product suppliers error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get suppliers'
    });
  }
};

module.exports = {
  createSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  linkProductToSupplier,
  getProductSuppliers
};
