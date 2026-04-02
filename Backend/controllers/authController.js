// controllers/authController.js
// Authentication Route Handlers

const authService = require('../services/authService');
const auditLogService = require('../services/auditLogService');

// Register User
const register = async (req, res, next) => {
  try {
    const { username, email, password, role, first_name, last_name } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }

    const user = await authService.registerUser({
      username,
      email,
      password,
      role,
      first_name,
      last_name
    });

    // Log audit trail
    try {
      await auditLogService.logAction({
        user_id: req.user ? req.user.user_id : null,
        action: 'CREATE',
        entity_type: 'user',
        entity_id: user.user_id,
        old_values: null,
        new_values: { username: user.username, email: user.email, role: user.role },
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success'
      });
    } catch (auditError) {
      console.error('Audit logging error:', auditError);
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
};

// Login User
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const result = await authService.loginUser(email, password);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
};

// Get Current User Profile
const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getUserProfile(req.user.user_id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get profile'
    });
  }
};

// Update User Profile
const updateProfile = async (req, res, next) => {
  try {
    const { first_name, last_name } = req.body;
    const oldProfile = await authService.getUserProfile(req.user.user_id);

    const user = await authService.updateUserProfile(req.user.user_id, {
      first_name,
      last_name
    });

    // Log audit trail
    try {
      await auditLogService.logAction({
        user_id: req.user.user_id,
        action: 'UPDATE',
        entity_type: 'user',
        entity_id: req.user.user_id,
        old_values: { first_name: oldProfile.first_name, last_name: oldProfile.last_name },
        new_values: { first_name: user.first_name, last_name: user.last_name },
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success'
      });
    } catch (auditError) {
      console.error('Audit logging error:', auditError);
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile'
    });
  }
};

// Change Password
const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All password fields are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }

    const result = await authService.changePassword(req.user.user_id, oldPassword, newPassword);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to change password'
    });
  }
};

// Logout User
const logout = async (req, res, next) => {
  try {
    // JWT is stateless, so logout is handled on client side
    // This endpoint can be used for audit logging if needed

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword
};
