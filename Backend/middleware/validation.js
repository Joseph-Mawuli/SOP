// middleware/validation.js
// Input Validation Middleware

const validator = require('validator');

// Validate Email
const validateEmail = (email) => {
  return validator.isEmail(email);
};

// Validate Password (min 6 characters)
const validatePassword = (password) => {
  return password && password.length >= 6;
};

// Validate Phone
const validatePhone = (phone) => {
  return /^\+?[1-9]\d{1,14}$/.test(phone);
};

// Validate Decimal (for prices)
const validateDecimal = (value, min = 0, max = 999999.99) => {
  const num = parseFloat(value);
  return !isNaN(num) && num >= min && num <= max;
};

// Sanitize string
const sanitizeString = (str) => {
  return validator.trim(validator.escape(str));
};

// Validate Product Data
const validateProductData = (data) => {
  const errors = {};

  if (!data.product_name || !sanitizeString(data.product_name)) {
    errors.product_name = 'Product name is required';
  }

  if (!data.category || !sanitizeString(data.category)) {
    errors.category = 'Category is required';
  }

  if (!data.unit_price || !validateDecimal(data.unit_price, 0.01)) {
    errors.unit_price = 'Valid unit price is required';
  }

  return Object.keys(errors).length === 0 ? null : errors;
};

// Validate User Data
const validateUserData = (data) => {
  const errors = {};

  if (!data.username || data.username.length < 3) {
    errors.username = 'Username must be at least 3 characters';
  }

  if (!validateEmail(data.email)) {
    errors.email = 'Valid email is required';
  }

  if (!validatePassword(data.password)) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (!['administrator', 'cashier'].includes(data.role)) {
    errors.role = 'Invalid role';
  }

  return Object.keys(errors).length === 0 ? null : errors;
};

// Validate Sales Data
const validateSalesData = (data) => {
  const errors = {};

  if (!Array.isArray(data.items) || data.items.length === 0) {
    errors.items = 'At least one item is required';
  }

  if (!['cash', 'mobile_money', 'card', 'split'].includes(data.payment_method)) {
    errors.payment_method = 'Invalid payment method';
  }

  if (!validateDecimal(data.amount_paid, 0)) {
    errors.amount_paid = 'Valid amount paid is required';
  }

  return Object.keys(errors).length === 0 ? null : errors;
};

// Validate Supplier Data
const validateSupplierData = (data) => {
  const errors = {};

  if (!data.supplier_name || !sanitizeString(data.supplier_name)) {
    errors.supplier_name = 'Supplier name is required';
  }

  if (data.email && !validateEmail(data.email)) {
    errors.email = 'Valid email is required';
  }

  if (data.phone && !validatePhone(data.phone)) {
    errors.phone = 'Valid phone number is required';
  }

  return Object.keys(errors).length === 0 ? null : errors;
};

module.exports = {
  validateEmail,
  validatePassword,
  validatePhone,
  validateDecimal,
  sanitizeString,
  validateProductData,
  validateUserData,
  validateSalesData,
  validateSupplierData
};
