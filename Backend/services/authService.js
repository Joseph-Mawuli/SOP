// services/authService.js
// Authentication Business Logic

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { validateEmail, validatePassword } = require('../middleware/validation');

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Hash Password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Compare Password
const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

// Register User
const registerUser = async (userData) => {
  try {
    // Validate input
    if (!validateEmail(userData.email)) {
      throw { message: 'Invalid email format' };
    }

    if (!validatePassword(userData.password)) {
      throw { message: 'Password must be at least 6 characters' };
    }

    // Check if user already exists
    const userExists = await query(
      'SELECT user_id FROM users WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($2)',
      [userData.email, userData.username]
    );

    if (userExists.rows.length > 0) {
      throw { message: 'User already exists' };
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create user (store email in lowercase for consistency)
    const result = await query(
      `INSERT INTO users (username, email, password_hash, role, first_name, last_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING user_id, username, email, role, first_name, last_name`,
      [userData.username, userData.email.toLowerCase(), hashedPassword, userData.role || 'cashier', userData.first_name, userData.last_name]
    );

    const user = result.rows[0];
    
    // Generate token for auto-login
    const token = generateToken(user);

    return {
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name
      }
    };
  } catch (error) {
    throw error;
  }
};

// Login User
const loginUser = async (email, password) => {
  try {
    // Find user by email (case-insensitive)
    const result = await query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      throw { message: 'Invalid credentials' };
    }

    const user = result.rows[0];

    // Compare password
    const isValid = await comparePassword(password, user.password_hash);

    if (!isValid) {
      throw { message: 'Invalid credentials' };
    }

    // Generate token
    const token = generateToken(user);

    return {
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name
      }
    };
  } catch (error) {
    throw error;
  }
};

// Get User Profile
const getUserProfile = async (userId) => {
  try {
    const result = await query(
      'SELECT user_id, username, email, role, first_name, last_name, is_active, created_at FROM users WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw { message: 'User not found' };
    }

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Update User Profile
const updateUserProfile = async (userId, updateData) => {
  try {
    const result = await query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $3
       RETURNING user_id, username, email, role, first_name, last_name`,
      [updateData.first_name, updateData.last_name, userId]
    );

    if (result.rows.length === 0) {
      throw { message: 'User not found' };
    }

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Change Password
const changePassword = async (userId, oldPassword, newPassword) => {
  try {
    // Validate new password
    if (!validatePassword(newPassword)) {
      throw { message: 'Password must be at least 6 characters' };
    }

    // Get user
    const userResult = await query(
      'SELECT password_hash FROM users WHERE user_id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw { message: 'User not found' };
    }

    // Verify old password
    const isValid = await comparePassword(oldPassword, userResult.rows[0].password_hash);

    if (!isValid) {
      throw { message: 'Invalid old password' };
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [hashedPassword, userId]
    );

    return { message: 'Password changed successfully' };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  registerUser,
  loginUser,
  generateToken,
  hashPassword,
  comparePassword,
  getUserProfile,
  updateUserProfile,
  changePassword
};
