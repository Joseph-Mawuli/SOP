// services/auditLogService.js
// Audit Logging Service for Comprehensive Logging

const { query } = require('../config/database');

// Log an action to audit_logs table
const logAction = async (auditData) => {
  try {
    const {
      user_id,
      action,
      entity_type,
      entity_id,
      old_values,
      new_values,
      ip_address,
      user_agent,
      status = 'success',
      error_message
    } = auditData;

    // entity_id column is INT in schema; prevent crashes from non-numeric ids (e.g. Paystack references)
    const normalizedEntityId = Number.isInteger(Number(entity_id)) ? Number(entity_id) : null;

    const result = await query(
      `INSERT INTO audit_logs 
       (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, status, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        user_id || null,
        action,
        entity_type,
        normalizedEntityId,
        JSON.stringify(old_values || {}),
        JSON.stringify(new_values || {}),
        ip_address,
        user_agent,
        status,
        error_message || null
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Audit log error:', error);
    throw error;
  }
};

// Get audit logs with filters
const getAuditLogs = async ({ 
  user_id, 
  entity_type, 
  action, 
  start_date, 
  end_date, 
  limit = 100 
} = {}) => {
  try {
    let queryText = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];

    if (user_id) {
      params.push(user_id);
      queryText += ` AND user_id = $${params.length}`;
    }

    if (entity_type) {
      params.push(entity_type);
      queryText += ` AND entity_type = $${params.length}`;
    }

    if (action) {
      params.push(action);
      queryText += ` AND action = $${params.length}`;
    }

    if (start_date) {
      params.push(start_date);
      queryText += ` AND created_at >= $${params.length}`;
    }

    if (end_date) {
      params.push(end_date);
      queryText += ` AND created_at <= $${params.length}`;
    }

    params.push(limit);
    queryText += ` ORDER BY created_at DESC LIMIT $${params.length}`;

    const result = await query(queryText, params);
    return result.rows;
  } catch (error) {
    console.error('Get audit logs error:', error);
    throw error;
  }
};

// Get audit logs for a specific entity
const getEntityAuditHistory = async (entity_type, entity_id) => {
  try {
    const result = await query(
      `SELECT * FROM audit_logs 
       WHERE entity_type = $1 AND entity_id = $2 
       ORDER BY created_at DESC`,
      [entity_type, entity_id]
    );

    return result.rows;
  } catch (error) {
    console.error('Get entity audit history error:', error);
    throw error;
  }
};

// Get user activity log
const getUserActivityLog = async (user_id, limit = 50) => {
  try {
    const result = await query(
      `SELECT * FROM audit_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [user_id, limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Get user activity log error:', error);
    throw error;
  }
};

module.exports = {
  logAction,
  getAuditLogs,
  getEntityAuditHistory,
  getUserActivityLog,
};
