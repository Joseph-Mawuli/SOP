// controllers/inventoryController.js
// Inventory Management Route Handlers

const inventoryService = require("../services/inventoryService");
const auditLogService = require('../services/auditLogService');

// Get Inventory
const getInventory = async (req, res, next) => {
 try {
  const { productId } = req.params;

  const inventory = await inventoryService.getInventory(productId);

  res.status(200).json({
   success: true,
   data: inventory,
  });
 } catch (error) {
  console.error("Get inventory error:", error);
  res.status(404).json({
   success: false,
   message: error.message || "Inventory not found",
  });
 }
};

// Get All Inventory
const getAllInventory = async (req, res, next) => {
 try {
  const inventory = await inventoryService.getAllInventory();

  res.status(200).json({
   success: true,
   count: inventory.length,
   data: inventory,
  });
 } catch (error) {
  console.error("Get all inventory error:", error);
  res.status(500).json({
   success: false,
   message: error.message || "Failed to get inventory",
  });
 }
};

// Get Low Stock Alerts
const getLowStockAlerts = async (req, res, next) => {
 try {
  const alerts = await inventoryService.getLowStockAlerts();

  res.status(200).json({
   success: true,
   count: alerts.length,
   data: alerts,
  });
 } catch (error) {
  console.error("Get low stock alerts error:", error);
  res.status(500).json({
   success: false,
   message: error.message || "Failed to get alerts",
  });
 }
};

// Adjust Stock
const adjustStock = async (req, res, next) => {
 try {
  const { product_id, quantity, adjustment_quantity, adjustment_type, type, reason } = req.body;

  // Support both field name conventions from frontend
  const finalQuantity = quantity || adjustment_quantity;
  const finalType = type || adjustment_type;

  if (!product_id || !finalQuantity || !finalType) {
   return res.status(400).json({
    success: false,
    message: "Product ID, quantity, and type are required",
   });
  }

  // ── FIX: support both .user_id and .id from JWT payload ──
  const userId = req.user.user_id || req.user.id;
  if (!userId) {
   return res.status(401).json({
    success: false,
    message: "Cannot identify user from token",
   });
  }

  const result = await inventoryService.adjustStock(product_id, finalQuantity, finalType, reason, userId);

  // Log audit trail
  try {
    await auditLogService.logAction({
      user_id: userId,
      action: 'UPDATE',
      entity_type: 'inventory',
      entity_id: product_id,
      old_values: { quantity: result.old_quantity },
      new_values: { quantity: result.new_quantity, type: finalType },
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      status: 'success'
    });
  } catch (auditError) {
    console.error('Audit logging error:', auditError);
  }

  res.status(200).json({
   success: true,
   message: "Stock adjusted successfully",
   data: result,
  });
 } catch (error) {
  console.error("Adjust stock error:", error);
  res.status(400).json({
   success: false,
   message: error.message || "Failed to adjust stock",
  });
 }
};

// Get Adjustments History
const getAdjustmentsHistory = async (req, res, next) => {
 try {
  const { productId } = req.query;

  const history = await inventoryService.getAdjustmentsHistory(productId);

  res.status(200).json({
   success: true,
   count: history.length,
   data: history,
  });
 } catch (error) {
  console.error("Get adjustments history error:", error);
  res.status(500).json({
   success: false,
   message: error.message || "Failed to get history",
  });
 }
};

// Get Inventory Stats
const getInventoryStats = async (req, res, next) => {
 try {
  const stats = await inventoryService.getInventoryStats();

  res.status(200).json({
   success: true,
   data: stats,
  });
 } catch (error) {
  console.error("Get inventory stats error:", error);
  res.status(500).json({
   success: false,
   message: error.message || "Failed to get stats",
  });
 }
};

module.exports = {
 getInventory,
 getAllInventory,
 getLowStockAlerts,
 adjustStock,
 getAdjustmentsHistory,
 getInventoryStats,
};
