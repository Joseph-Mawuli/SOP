// routes/userRoutes.js
// User Management API Routes

const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verifyToken, requireRole } = require("../middleware/auth");

// All user routes require authentication + admin role
router.get("/", verifyToken, requireRole("administrator"), userController.getAllUsers);
router.get("/:userId", verifyToken, requireRole("administrator"), userController.getUserById);
router.put("/:userId", verifyToken, requireRole("administrator"), userController.updateUser);
router.delete("/:userId", verifyToken, requireRole("administrator"), userController.deleteUser);

module.exports = router;
