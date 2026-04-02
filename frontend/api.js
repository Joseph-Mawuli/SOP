// api.js
// API Client for Backend Communication

const API_BASE_URL = "http://localhost:5000/api";

// Store token and user info
let authToken = localStorage.getItem("auth_token");
let currentUser = JSON.parse(localStorage.getItem("current_user") || "null");

// API Request Handler
async function apiRequest(endpoint, method = "GET", data = null) {
 try {
  const options = {
   method,
   headers: {
    "Content-Type": "application/json",
   },
  };

  if (authToken) {
   options.headers.Authorization = `Bearer ${authToken}`;
  }

  if (data && (method === "POST" || method === "PUT")) {
   options.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

  if (!response.ok) {
   if (response.status === 401) {
    logout();
   }
   const errorData = await response.json();
   throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  const result = await response.json();
  return result;
 } catch (error) {
  console.error("API Error:", error);
  throw error;
 }
}

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

async function login(email, password) {
 const result = await apiRequest("/auth/login", "POST", { email, password });
 authToken = result.data.token;
 currentUser = result.data.user;
 localStorage.setItem("auth_token", authToken);
 localStorage.setItem("current_user", JSON.stringify(currentUser));
 return result.data;
}

function logout() {
 authToken = null;
 currentUser = null;
 localStorage.removeItem("auth_token");
 localStorage.removeItem("current_user");
}

async function getProfile() {
 const result = await apiRequest("/auth/profile");
 return result.data;
}

// ============================================
// USER MANAGEMENT ENDPOINTS (Admin only)
// ============================================

async function getAllUsers(filters = {}) {
 // Strip empty values so they don't pollute the query string
 const cleaned = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== "" && v != null));
 const params = new URLSearchParams(cleaned);
 const result = await apiRequest(`/users?${params}`);
 return result.data || [];
}

async function getUserById(userId) {
 const result = await apiRequest(`/users/${userId}`);
 return result.data;
}

async function createUser(userData) {
 // Uses /auth/register but we MUST NOT touch authToken or currentUser.
 // registerUser() always returns { token, user } — we silently discard
 // the token so the admin session is never overwritten.
 const response = await fetch(`${API_BASE_URL}/auth/register`, {
  method: "POST",
  headers: {
   "Content-Type": "application/json",
   Authorization: `Bearer ${authToken}`,
  },
  body: JSON.stringify(userData),
 });

 const result = await response.json();

 if (!response.ok) {
  throw new Error(result.message || "Failed to create user");
 }

 // Return only the user object — token is intentionally ignored
 return result.data?.user || result.data || result;
}

async function updateUser(userId, userData) {
 const result = await apiRequest(`/users/${userId}`, "PUT", userData);
 return result.data;
}

async function deleteUser(userId) {
 await apiRequest(`/users/${userId}`, "DELETE");
}

// ============================================
// PRODUCT ENDPOINTS
// ============================================

async function getAllProducts(filters = {}) {
 const params = new URLSearchParams(filters);
 const result = await apiRequest(`/products?${params}`);
 return result.data || [];
}

async function getProductById(productId) {
 const result = await apiRequest(`/products/${productId}`);
 return result.data;
}

async function getProductByBarcode(barcode) {
 const result = await apiRequest(`/products/barcode/${barcode}`);
 return result.data;
}

async function createProduct(productData) {
 const result = await apiRequest("/products", "POST", productData);
 return result.data;
}

async function updateProduct(productId, productData) {
 const result = await apiRequest(`/products/${productId}`, "PUT", productData);
 return result.data;
}

async function deleteProduct(productId) {
 await apiRequest(`/products/${productId}`, "DELETE");
}

async function searchProducts(query) {
 const result = await apiRequest(`/products/search?query=${encodeURIComponent(query)}`);
 return result.data || [];
}

async function getCategories() {
 const result = await apiRequest("/products/categories");
 return result.data || [];
}

// ============================================
// INVENTORY ENDPOINTS
// ============================================

async function getAllInventory() {
 const result = await apiRequest("/inventory");
 return result.data || [];
}

async function getInventory(productId) {
 const result = await apiRequest(`/inventory/product/${productId}`);
 return result.data;
}

async function getLowStockAlerts() {
 const result = await apiRequest("/inventory/low-stock");
 return result.data || [];
}

async function adjustStock(adjustmentData) {
 const result = await apiRequest("/inventory/adjust", "POST", adjustmentData);
 return result.data;
}

async function getInventoryStats() {
 const result = await apiRequest("/inventory/stats");
 return result.data;
}

// ============================================
// SALES ENDPOINTS
// ============================================

async function createSale(saleData) {
 const result = await apiRequest("/sales", "POST", saleData);
 return result.data;
}

async function getSaleById(saleId) {
 const result = await apiRequest(`/sales/${saleId}`);
 return result.data;
}

async function getAllSales(filters = {}) {
 const params = new URLSearchParams(filters);
 const result = await apiRequest(`/sales?${params}`);
 return result.data || [];
}

async function getDailySales(date) {
 const result = await apiRequest(`/sales/daily?date=${date}`);
 return result.data || [];
}

async function getDailySalesSummary(date) {
 const result = await apiRequest(`/sales/summary/daily?date=${date}`);
 return result.data;
}

async function getWeeklySalesSummary() {
 const result = await apiRequest("/sales/summary/weekly");
 return result.data || [];
}

// ============================================
// PAYMENT ENDPOINTS
// ============================================

async function processPayment(paymentData) {
 const result = await apiRequest("/payments", "POST", paymentData);
 return result.data;
}

async function getPaymentBySaleId(saleId) {
 const result = await apiRequest(`/payments/sale/${saleId}`);
 return result.data;
}

async function getPaymentStats(startDate, endDate) {
 const result = await apiRequest(`/payments/stats?start_date=${startDate}&end_date=${endDate}`);
 return result.data || [];
}

// ==================== PAYSTACK PAYMENT ENDPOINTS ====================

async function initializePaystackPayment(paymentData) {
 const result = await apiRequest("/payments/paystack/initialize", "POST", paymentData);
 return result.data;
}

async function verifyPaystackPayment(reference) {
 const result = await apiRequest(`/payments/paystack/verify/${reference}`);
 return result.data;
}

async function getPaystackPaymentDetails(saleId) {
 const result = await apiRequest(`/payments/paystack/details/${saleId}`);
 return result.data;
}

// ============================================
// CUSTOMER ENDPOINTS
// ============================================

async function registerCustomer(customerData) {
 const result = await apiRequest("/customers", "POST", customerData);
 return result.data;
}

async function getAllCustomers(filters = {}) {
 const params = new URLSearchParams(filters);
 const result = await apiRequest(`/customers?${params}`);
 return result.data || [];
}

async function getCustomerById(customerId) {
 const result = await apiRequest(`/customers/${customerId}`);
 return result.data;
}

async function updateCustomer(customerId, customerData) {
 const result = await apiRequest(`/customers/${customerId}`, "PUT", customerData);
 return result.data;
}

async function getPurchaseHistory(customerId) {
 const result = await apiRequest(`/customers/${customerId}/history`);
 return result.data || [];
}

async function addLoyaltyPoints(customerId, points) {
 const result = await apiRequest(`/customers/${customerId}/loyalty`, "POST", { points });
 return result.data;
}

async function getCustomerStats() {
 const result = await apiRequest("/customers/stats");
 return result.data;
}

async function deleteCustomer(customerId) {
 const result = await apiRequest(`/customers/${customerId}`, "DELETE");
 return result.data;
}

// ============================================
// REPORT ENDPOINTS
// ============================================

async function getDailySalesReport(date) {
 const result = await apiRequest(`/reports/daily?date=${date}`);
 return result.data;
}

async function getWeeklySalesReport() {
 const result = await apiRequest("/reports/weekly");
 return result.data || [];
}

async function getProductPerformanceReport(startDate, endDate) {
 const result = await apiRequest(`/reports/product-performance?start_date=${startDate}&end_date=${endDate}`);
 return result.data || [];
}

async function getInventoryStatusReport() {
 const result = await apiRequest("/reports/inventory-status");
 return result.data || [];
}

async function getCashierPerformanceReport(startDate, endDate) {
 const result = await apiRequest(`/reports/cashier-performance?start_date=${startDate}&end_date=${endDate}`);
 return result.data || [];
}

async function getRevenueSummaryReport(startDate, endDate) {
 const result = await apiRequest(`/reports/revenue-summary?start_date=${startDate}&end_date=${endDate}`);
 return result.data;
}

async function getTopProductsReport(startDate, endDate, limit = 10) {
 const result = await apiRequest(`/reports/top-products?start_date=${startDate}&end_date=${endDate}&limit=${limit}`);
 return result.data || [];
}

async function getCategoryPerformanceReport(startDate, endDate) {
 const result = await apiRequest(`/reports/category-performance?start_date=${startDate}&end_date=${endDate}`);
 return result.data || [];
}

async function exportReport(reportType, startDate, endDate) {
 const result = await apiRequest(
  `/reports/export?reportType=${reportType}&start_date=${startDate}&end_date=${endDate}`,
 );
 return result;
}

// ============================================
// RECEIPT ENDPOINTS
// ============================================

async function getReceipt(saleId) {
 const result = await apiRequest(`/receipts/${saleId}`);
 return result.data;
}

async function getReceiptText(saleId) {
 const response = await fetch(`${API_BASE_URL}/receipts/${saleId}/text`, {
  headers: { Authorization: `Bearer ${authToken}` },
 });
 if (!response.ok) throw new Error("Failed to get receipt text");
 return await response.text();
}

async function getRecentReceipts(limit = 10) {
 const result = await apiRequest(`/receipts/recent?limit=${limit}`);
 return result.data || [];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function isAuthenticated() {
 return !!authToken;
}

function getCurrentUser() {
 return currentUser;
}

function setAuthToken(token) {
 authToken = token;
 localStorage.setItem("auth_token", token);
}

function setCurrentUser(user) {
 currentUser = user;
 localStorage.setItem("current_user", JSON.stringify(user));
}
