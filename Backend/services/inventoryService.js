// services/inventoryService.js
// Inventory Management Business Logic

const { query } = require("../config/database");

// Get Inventory for Product
const getInventory = async (productId) => {
 try {
  const result = await query(
   `SELECT i.*, p.product_name, p.unit_price 
       FROM inventory i
       JOIN products p ON i.product_id = p.product_id
       WHERE i.product_id = $1`,
   [productId],
  );

  if (result.rows.length === 0) {
   throw { message: "Inventory record not found" };
  }

  return result.rows[0];
 } catch (error) {
  throw error;
 }
};

// Get All Inventory
const getAllInventory = async () => {
 try {
  const result = await query(
   `SELECT i.*, p.product_name, p.category, p.unit_price, p.barcode
       FROM inventory i
       JOIN products p ON i.product_id = p.product_id
       WHERE p.is_active = true
       ORDER BY p.product_name`,
  );

  return result.rows;
 } catch (error) {
  throw error;
 }
};

// Get Low Stock Alerts
const getLowStockAlerts = async () => {
 try {
  const result = await query(
   `SELECT i.*, p.product_name, p.category, p.unit_price, p.barcode
       FROM inventory i
       JOIN products p ON i.product_id = p.product_id
       WHERE p.is_active = true AND i.quantity_on_hand <= i.reorder_level
       ORDER BY i.quantity_on_hand ASC`,
  );

  return result.rows;
 } catch (error) {
  throw error;
 }
};

// Deduct Stock (for sales)
const deductStock = async (productId, quantity) => {
 try {
  const inventoryResult = await query("SELECT quantity_on_hand FROM inventory WHERE product_id = $1", [productId]);

  if (inventoryResult.rows.length === 0) {
   throw { message: "Product not found in inventory" };
  }

  const currentStock = inventoryResult.rows[0].quantity_on_hand;

  if (currentStock < quantity) {
   throw { message: "Insufficient stock" };
  }

  const result = await query(
   `UPDATE inventory 
       SET quantity_on_hand = quantity_on_hand - $1,
           last_updated = CURRENT_TIMESTAMP
       WHERE product_id = $2
       RETURNING *`,
   [quantity, productId],
  );

  return result.rows[0];
 } catch (error) {
  throw error;
 }
};

// Adjust Stock
const adjustStock = async (productId, adjustmentQuantity, adjustmentType, reason, userId) => {
 const client = await require("../config/database").getClient();

 try {
  await client.query("BEGIN");

  // Validate inputs
  if (!productId || !adjustmentQuantity || !adjustmentType) {
   throw new Error("Missing required fields: productId, adjustmentQuantity, adjustmentType");
  }

  // ── FIX 1: Accept both id field names from JWT ──
  // req.user might expose .user_id or .id depending on how the token was signed
  if (!userId) {
   throw new Error("User ID is required (not authenticated)");
  }

  // ── FIX 2: Normalise type ONCE, use the normalised value everywhere ──
  // Frontend sends: 'add' | 'remove' | 'set'
  // DB stores:      'add' | 'reduce' | 'correction'
  let dbAdjustmentType;
  switch (adjustmentType) {
   case "add":
    dbAdjustmentType = "add";
    break;
   case "remove":
   case "reduce":
    dbAdjustmentType = "reduce";
    break;
   case "set":
   case "correction":
    dbAdjustmentType = "correction";
    break;
   default:
    throw new Error(`Invalid adjustment type: "${adjustmentType}"`);
  }

  // Record adjustment history
  await client.query(
   `INSERT INTO inventory_adjustments (product_id, adjustment_quantity, adjustment_type, reason, adjusted_by)
       VALUES ($1, $2, $3, $4, $5)`,
   [productId, adjustmentQuantity, dbAdjustmentType, reason || null, userId],
  );

  // Build the UPDATE expression using the normalised DB type
  let adjustmentOp;
  switch (dbAdjustmentType) {
   case "add":
    adjustmentOp = `quantity_on_hand + $1`;
    break;
   case "reduce":
    adjustmentOp = `quantity_on_hand - $1`;
    break;
   case "correction":
    adjustmentOp = `$1`;
    break;
  }

  const result = await client.query(
   `UPDATE inventory 
       SET quantity_on_hand = ${adjustmentOp},
           last_updated = CURRENT_TIMESTAMP
       WHERE product_id = $2
       RETURNING *`,
   [adjustmentQuantity, productId],
  );

  if (result.rows.length === 0) {
   throw { message: "Product not found in inventory" };
  }

  await client.query("COMMIT");
  return result.rows[0];
 } catch (error) {
  await client.query("ROLLBACK");
  throw error;
 } finally {
  client.release();
 }
};

// Get Inventory Adjustments History
const getAdjustmentsHistory = async (productId = null) => {
 try {
  let query_text = `
      SELECT a.*, p.product_name, u.username
      FROM inventory_adjustments a
      JOIN products p ON a.product_id = p.product_id
      JOIN users u ON a.adjusted_by = u.user_id
    `;
  const params = [];

  if (productId) {
   query_text += ` WHERE a.product_id = $1`;
   params.push(productId);
  }

  query_text += ` ORDER BY a.created_at DESC`;

  const result = await query(query_text, params);
  return result.rows;
 } catch (error) {
  throw error;
 }
};

// Check Stock Availability
const checkStockAvailability = async (productId, requiredQuantity) => {
 try {
  const result = await query("SELECT quantity_on_hand FROM inventory WHERE product_id = $1", [productId]);

  if (result.rows.length === 0) {
   return { available: false, quantity: 0 };
  }

  const available = result.rows[0].quantity_on_hand >= requiredQuantity;
  return {
   available,
   quantity: result.rows[0].quantity_on_hand,
  };
 } catch (error) {
  throw error;
 }
};

// Get Inventory Statistics
const getInventoryStats = async () => {
 try {
  const result = await query(
   `SELECT 
        COUNT(*) as total_products,
        SUM(quantity_on_hand) as total_stock_value,
        SUM(quantity_on_hand * p.unit_price) as inventory_value,
        COUNT(CASE WHEN quantity_on_hand <= reorder_level THEN 1 END) as low_stock_count
       FROM inventory i
       JOIN products p ON i.product_id = p.product_id
       WHERE p.is_active = true`,
  );

  return result.rows[0];
 } catch (error) {
  throw error;
 }
};

module.exports = {
 getInventory,
 getAllInventory,
 getLowStockAlerts,
 deductStock,
 adjustStock,
 getAdjustmentsHistory,
 checkStockAvailability,
 getInventoryStats,
};
