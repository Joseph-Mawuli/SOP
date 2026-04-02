// routes/auditLogRoutes.js
// Audit Log Routes (Admin only)

const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const { verifyToken, requireRole } = require('../middleware/auth');

// All audit log routes require authentication and admin role
router.use(verifyToken);
router.use(requireRole('administrator'));

// Get audit logs with filters
router.get('/', auditLogController.getAuditLogs);

// Get audit history for specific entity
router.get('/:entity_type/:entity_id', auditLogController.getEntityAuditHistory);

// Get user activity log
router.get('/user/:user_id', auditLogController.getUserActivityLog);

module.exports = router;
