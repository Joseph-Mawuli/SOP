// services/userService.js
// User Management Business Logic

const { query } = require("../config/database");
const bcrypt = require("bcryptjs");

// Hash Password helper
const hashPassword = async (password) => {
 const salt = await bcrypt.genSalt(10);
 return bcrypt.hash(password, salt);
};

// Get All Users
const getAllUsers = async ({ search, role } = {}) => {
 try {
  let queryText = `
      SELECT user_id, username, email, role, first_name, last_name, is_active, created_at
      FROM users
      WHERE is_active = true
    `;
  const params = [];

  if (search) {
   params.push(`%${search}%`);
   queryText += ` AND (
        LOWER(username)   LIKE LOWER($${params.length}) OR
        LOWER(email)      LIKE LOWER($${params.length}) OR
        LOWER(first_name) LIKE LOWER($${params.length}) OR
        LOWER(last_name)  LIKE LOWER($${params.length})
      )`;
  }

  if (role) {
   params.push(role);
   queryText += ` AND role = $${params.length}`;
  }

  queryText += ` ORDER BY created_at DESC`;

  const result = await query(queryText, params);
  return result.rows;
 } catch (error) {
  throw error;
 }
};

// Get User By ID
const getUserById = async (userId) => {
 try {
  const result = await query(
   `SELECT user_id, username, email, role, first_name, last_name, is_active, created_at
       FROM users
       WHERE user_id = $1`,
   [userId],
  );

  if (result.rows.length === 0) {
   throw { message: "User not found" };
  }

  return result.rows[0];
 } catch (error) {
  throw error;
 }
};

// Update User
const updateUser = async (userId, updateData) => {
 try {
  const { first_name, last_name, username, email, role, password } = updateData;

  // Check if username or email is taken by another user
  if (username || email) {
   const conflict = await query(
    `SELECT user_id FROM users
         WHERE (LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2))
         AND user_id != $3`,
    [username || "", email || "", userId],
   );

   if (conflict.rows.length > 0) {
    throw { message: "Username or email already in use by another user" };
   }
  }

  // Hash password if provided
  let passwordClause = "";
  const params = [first_name, last_name, username, email, role, userId];

  if (password && password.trim() !== "") {
   if (password.length < 6) {
    throw { message: "Password must be at least 6 characters" };
   }
   const hashed = await hashPassword(password);
   params.splice(5, 0, hashed); // insert before userId
   passwordClause = `, password_hash = $6`;
  }

  const userIdParam = password && password.trim() !== "" ? 7 : 6;

  const result = await query(
   `UPDATE users
       SET first_name  = COALESCE($1, first_name),
           last_name   = COALESCE($2, last_name),
           username    = COALESCE($3, username),
           email       = COALESCE($4, email),
           role        = COALESCE($5, role)
           ${passwordClause},
           updated_at  = CURRENT_TIMESTAMP
       WHERE user_id = $${userIdParam}
       RETURNING user_id, username, email, role, first_name, last_name, is_active`,
   params,
  );

  if (result.rows.length === 0) {
   throw { message: "User not found" };
  }

  return result.rows[0];
 } catch (error) {
  throw error;
 }
};

// Delete User (soft delete — sets is_active = false)
const deleteUser = async (userId) => {
 try {
  const result = await query(
   `UPDATE users
       SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1
       RETURNING user_id`,
   [userId],
  );

  if (result.rows.length === 0) {
   throw { message: "User not found" };
  }

  return result.rows[0];
 } catch (error) {
  throw error;
 }
};

module.exports = {
 getAllUsers,
 getUserById,
 updateUser,
 deleteUser,
};
