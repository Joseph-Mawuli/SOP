// middleware/validation.js
// Input Validation Middleware

const validator = require("validator");

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
// ✅ FIX 1: The original sanitizeString used validator.escape() which converts
// characters like apostrophes → &apos; and & → &amp;. This is fine for HTML
// output but corrupts data stored in your database (e.g. "Kofi's Shop" becomes
// "Kofi&#x27;s Shop"). Use trim() only for DB storage; escape only at render time.
const sanitizeString = (str) => {
 if (typeof str !== "string") return "";
 return validator.trim(str);
};

// Validate Product Data
const validateProductData = (data) => {
 const errors = {};

 // ✅ FIX 2: The original checked !sanitizeString(data.product_name) which is
 // always truthy for non-empty strings — it never actually caught blank/whitespace
 // names. Use .trim() explicitly to catch '   ' (spaces only) inputs.
 if (!data.product_name || !data.product_name.trim()) {
  errors.product_name = "Product name is required";
 }

 if (!data.category || !data.category.trim()) {
  errors.category = "Category is required";
 }

 if (!data.unit_price || !validateDecimal(data.unit_price, 0.01)) {
  errors.unit_price = "Valid unit price is required (must be greater than 0)";
 }

 return Object.keys(errors).length === 0 ? null : errors;
};

// Validate User Data
const validateUserData = (data) => {
 const errors = {};

 if (!data.username || data.username.length < 3) {
  errors.username = "Username must be at least 3 characters";
 }

 if (!data.email || !validateEmail(data.email)) {
  errors.email = "Valid email is required";
 }

 if (!validatePassword(data.password)) {
  errors.password = "Password must be at least 6 characters";
 }

 if (!["administrator", "cashier"].includes(data.role)) {
  errors.role = "Invalid role. Must be administrator or cashier";
 }

 return Object.keys(errors).length === 0 ? null : errors;
};

// Validate Sales Data
const validateSalesData = (data) => {
 const errors = {};

 if (!Array.isArray(data.items) || data.items.length === 0) {
  errors.items = "At least one item is required";
 }

 // ✅ FIX 4: Validate each item in the cart has a valid product_id and quantity.
 // The original validated that items existed but never checked their contents,
 // meaning [{product_id: null, quantity: -5}] would pass validation.
 if (Array.isArray(data.items)) {
  data.items.forEach((item, index) => {
   if (!item.product_id) {
    errors[`items[${index}].product_id`] = `Item ${index + 1}: product_id is required`;
   }
   if (!item.quantity || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1) {
    errors[`items[${index}].quantity`] = `Item ${index + 1}: quantity must be a positive integer`;
   }
  });
 }

 // ✅ FIX 5: 'paystack' is not a real payment method — it's a payment gateway.
 // The actual method processed through Paystack is 'card' or 'mobile_money'.
 // Keeping 'paystack' here creates a split between validation and your
 // processPayment service which only accepts ['cash','mobile_money','card','split'].
 // Solution: allow 'paystack' at the route level (it gets resolved to 'card'
 // internally) but keep it out of the core payment method enum to avoid confusion.
 const validPaymentMethods = ["cash", "mobile_money", "card", "split", "paystack"];
 if (!validPaymentMethods.includes(data.payment_method)) {
  errors.payment_method = "Invalid payment method. Must be cash, mobile_money, card, split, or paystack";
 }

 if (!validateDecimal(data.amount_paid, 0)) {
  errors.amount_paid = "Valid amount paid is required";
 }

 // ✅ FIX 6: Original used !data.tax_rate which flags 0 as invalid (falsy).
 // A 0% tax rate is perfectly valid (e.g. tax-exempt items).
 // Use explicit undefined/null check instead.
 if (data.tax_rate === undefined || data.tax_rate === null || !validateDecimal(data.tax_rate, 0, 100)) {
  errors.tax_rate = "Tax rate is required and must be between 0 and 100";
 }

 return Object.keys(errors).length === 0 ? null : errors;
};

// Validate Supplier Data
const validateSupplierData = (data) => {
 const errors = {};

 if (!data.supplier_name || !data.supplier_name.trim()) {
  errors.supplier_name = "Supplier name is required";
 }

 if (data.email && !validateEmail(data.email)) {
  errors.email = "Valid email is required";
 }

 if (data.phone && !validatePhone(data.phone)) {
  errors.phone = "Valid phone number is required";
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
 validateSupplierData,
};
