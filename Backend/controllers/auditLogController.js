// controllers/auditLogController.js
// Audit Log Viewing Route Handlers

const auditLogService = require('../services/auditLogService');

// Get audit logs with filters
const getAuditLogs = async (req, res, next) => {
  try {
    const { user_id, entity_type, action, start_date, end_date, limit } = req.query;

    const logs = await auditLogService.getAuditLogs({
      user_id,
      entity_type,
      action,
      start_date,
      end_date,
      limit: parseInt(limit) || 100
    });

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get audit logs'
    });
  }
};

// Get audit history for a specific entity
const getEntityAuditHistory = async (req, res, next) => {
  try {
    const { entity_type, entity_id } = req.params;

    if (!entity_type || !entity_id) {
      return res.status(400).json({
        success: false,
        message: 'Entity type and entity ID are required'
      });
    }

    const history = await auditLogService.getEntityAuditHistory(entity_type, entity_id);

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    console.error('Get entity audit history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get audit history'
    });
  }
};

// Get user activity log
const getUserActivityLog = async (req, res, next) => {
  try {
    const { user_id } = req.params;
    const { limit } = req.query;

    const logs = await auditLogService.getUserActivityLog(user_id, parseInt(limit) || 50);

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    console.error('Get user activity log error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get activity log'
    });
  }
};

module.exports = {
  getAuditLogs,
  getEntityAuditHistory,
  getUserActivityLog
};
