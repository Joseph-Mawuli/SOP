// controllers/userController.js
// User Management Route Handlers

const userService = require("../services/userService");
const auditLogService = require('../services/auditLogService');

// Get All Users
const getAllUsers = async (req, res, next) => {
 try {
  const { search, role } = req.query;
  const users = await userService.getAllUsers({ search, role });

  res.status(200).json({
   success: true,
   count: users.length,
   data: users,
  });
 } catch (error) {
  console.error("Get all users error:", error);
  res.status(500).json({
   success: false,
   message: error.message || "Failed to get users",
  });
 }
};

// Get User By ID
const getUserById = async (req, res, next) => {
 try {
  const { userId } = req.params;
  const user = await userService.getUserById(userId);

  res.status(200).json({
   success: true,
   data: user,
  });
 } catch (error) {
  console.error("Get user error:", error);
  res.status(404).json({
   success: false,
   message: error.message || "User not found",
  });
 }
};

// Update User
const updateUser = async (req, res, next) => {
 try {
  const { userId } = req.params;
  const { first_name, last_name, username, email, role, password } = req.body;

  // Prevent admin from accidentally demoting themselves
  if (parseInt(userId) === req.user.user_id && role && role !== req.user.role) {
   return res.status(400).json({
    success: false,
    message: "You cannot change your own role",
   });
  }

  const oldUser = await userService.getUserById(parseInt(userId));
  const user = await userService.updateUser(userId, {
   first_name,
   last_name,
   username,
   email,
   role,
   password,
  });

  // Log audit trail
  try {
    await auditLogService.logAction({
      user_id: req.user.user_id,
      action: 'UPDATE',
      entity_type: 'user',
      entity_id: parseInt(userId),
      old_values: { first_name: oldUser.first_name, last_name: oldUser.last_name, username: oldUser.username, email: oldUser.email, role: oldUser.role },
      new_values: { first_name: user.first_name, last_name: user.last_name, username: user.username, email: user.email, role: user.role },
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      status: 'success'
    });
  } catch (auditError) {
    console.error('Audit logging error:', auditError);
  }

  res.status(200).json({
   success: true,
   message: "User updated successfully",
   data: user,
  });
 } catch (error) {
  console.error("Update user error:", error);
  res.status(400).json({
   success: false,
   message: error.message || "Failed to update user",
  });
 }
};

// Delete User
const deleteUser = async (req, res, next) => {
 try {
  const { userId } = req.params;

  // Prevent admin from deleting themselves
  if (parseInt(userId) === req.user.user_id) {
   return res.status(400).json({
    success: false,
    message: "You cannot delete your own account",
   });
  }

  const deletedUser = await userService.getUserById(parseInt(userId));
  await userService.deleteUser(userId);

  // Log audit trail
  try {
    await auditLogService.logAction({
      user_id: req.user.user_id,
      action: 'DELETE',
      entity_type: 'user',
      entity_id: parseInt(userId),
      old_values: { username: deletedUser.username, email: deletedUser.email, role: deletedUser.role },
      new_values: null,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      status: 'success'
    });
  } catch (auditError) {
    console.error('Audit logging error:', auditError);
  }

  res.status(200).json({
   success: true,
   message: "User deleted successfully",
  });
 } catch (error) {
  console.error("Delete user error:", error);
  res.status(400).json({
   success: false,
   message: error.message || "Failed to delete user",
  });
 }
};

module.exports = {
 getAllUsers,
 getUserById,
 updateUser,
 deleteUser,
};
