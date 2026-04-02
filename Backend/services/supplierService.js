// services/supplierService.js
// Supplier Management Business Logic

const { query } = require('../config/database');

// Create Supplier
const createSupplier = async (supplierData) => {
  try {
    const {
      supplier_name,
      contact_person,
      phone,
      email,
      address,
      city,
      country,
      payment_terms
    } = supplierData;

    if (!supplier_name) {
      throw { message: 'Supplier name is required' };
    }

    const result = await query(
      `INSERT INTO suppliers 
       (supplier_name, contact_person, phone, email, address, city, country, payment_terms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [supplier_name, contact_person, phone, email, address, city, country, payment_terms]
    );

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Get All Suppliers
const getAllSuppliers = async ({ search } = {}) => {
  try {
    let queryText = 'SELECT * FROM suppliers WHERE is_active = true';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      queryText += ` AND (
        LOWER(supplier_name) LIKE LOWER($${params.length}) OR
        LOWER(contact_person) LIKE LOWER($${params.length}) OR
        LOWER(email) LIKE LOWER($${params.length})
      )`;
    }

    queryText += ' ORDER BY supplier_name';

    const result = await query(queryText, params);
    return result.rows;
  } catch (error) {
    throw error;
  }
};

// Get Supplier By ID
const getSupplierById = async (supplier_id) => {
  try {
    const result = await query(
      'SELECT * FROM suppliers WHERE supplier_id = $1 AND is_active = true',
      [supplier_id]
    );

    if (result.rows.length === 0) {
      throw { message: 'Supplier not found' };
    }

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Update Supplier
const updateSupplier = async (supplier_id, updateData) => {
  try {
    const { supplier_name, contact_person, phone, email, address, city, country, payment_terms } = updateData;

    const result = await query(
      `UPDATE suppliers
       SET supplier_name = COALESCE($1, supplier_name),
           contact_person = COALESCE($2, contact_person),
           phone = COALESCE($3, phone),
           email = COALESCE($4, email),
           address = COALESCE($5, address),
           city = COALESCE($6, city),
           country = COALESCE($7, country),
           payment_terms = COALESCE($8, payment_terms),
           updated_at = CURRENT_TIMESTAMP
       WHERE supplier_id = $9 AND is_active = true
       RETURNING *`,
      [supplier_name, contact_person, phone, email, address, city, country, payment_terms, supplier_id]
    );

    if (result.rows.length === 0) {
      throw { message: 'Supplier not found' };
    }

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Delete Supplier (soft delete)
const deleteSupplier = async (supplier_id) => {
  try {
    const result = await query(
      'UPDATE suppliers SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE supplier_id = $1 RETURNING supplier_id',
      [supplier_id]
    );

    if (result.rows.length === 0) {
      throw { message: 'Supplier not found' };
    }

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Link Product to Supplier
const linkProductToSupplier = async (linkData) => {
  try {
    const {
      product_id,
      supplier_id,
      supplier_sku,
      supplier_unit_price,
      lead_time_days,
      minimum_order_qty = 1
    } = linkData;

    const result = await query(
      `INSERT INTO product_suppliers 
       (product_id, supplier_id, supplier_sku, supplier_unit_price, lead_time_days, minimum_order_qty)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (product_id, supplier_id) DO UPDATE SET
       supplier_sku = EXCLUDED.supplier_sku,
       supplier_unit_price = EXCLUDED.supplier_unit_price,
       lead_time_days = EXCLUDED.lead_time_days,
       minimum_order_qty = EXCLUDED.minimum_order_qty
       RETURNING *`,
      [product_id, supplier_id, supplier_sku, supplier_unit_price, lead_time_days, minimum_order_qty]
    );

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Get Suppliers for a Product
const getProductSuppliers = async (product_id) => {
  try {
    const result = await query(
      `SELECT 
        ps.product_supplier_id,
        s.supplier_id,
        s.supplier_name,
        s.contact_person,
        s.phone,
        s.email,
        ps.supplier_sku,
        ps.supplier_unit_price,
        ps.lead_time_days,
        ps.minimum_order_qty
      FROM product_suppliers ps
      JOIN suppliers s ON ps.supplier_id = s.supplier_id
      WHERE ps.product_id = $1 AND s.is_active = true`,
      [product_id]
    );

    return result.rows;
  } catch (error) {
    throw error;
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
