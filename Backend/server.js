// server.js
// POS System Backend Entry Point

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter, loginLimiter, paymentLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const salesRoutes = require('./routes/salesRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const customerRoutes = require('./routes/customerRoutes');
const reportRoutes = require('./routes/reportRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const exportRoutes = require('./routes/exportRoutes');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers (CSP adjusted for Paystack inline checkout)
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://js.paystack.co', 'https://checkout.paystack.com', 'https://paystack.com', 'blob:'],
        scriptSrcElem: ["'self'", "'unsafe-inline'", 'https://js.paystack.co', 'https://checkout.paystack.com', 'https://paystack.com', 'blob:'],
        frameSrc: ["'self'", 'https://checkout.paystack.com', 'https://js.paystack.co', 'https://paystack.com', 'blob:'],
        connectSrc: ["'self'", 'https://api.paystack.co', 'https://checkout.paystack.com', 'https://cdn.jsdelivr.net'],
        imgSrc: ["'self'", 'data:', 'https:'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://paystack.com'],
        styleSrcElem: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://paystack.com'],
      },
    },
  }),
);

// CORS Configuration
const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests and local tools without Origin header
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Rate limiting middleware
app.use('/api/', generalLimiter);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// API Routes
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'POS System Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Config endpoint - serve Paystack public key to frontend
app.get('/api/config/paystack-public-key', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      publicKey: process.env.PAYSTACK_PUBLIC_KEY
    }
  });
});

// Authentication Routes (with stricter rate limit for login)
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);

// User Management Routes
app.use('/api/users', userRoutes);

// Product Routes
app.use('/api/products', productRoutes);

// Inventory Routes
app.use('/api/inventory', inventoryRoutes);

// Sales Routes
app.use('/api/sales', salesRoutes);

// Payment Routes (with stricter rate limit)
app.use('/api/payments', paymentLimiter);
app.use('/api/payments', paymentRoutes);

// Customer Routes
app.use('/api/customers', customerRoutes);

// Report Routes
app.use('/api/reports', reportRoutes);

// Receipt Routes
app.use('/api/receipts', receiptRoutes);

// Supplier Routes (NEW)
app.use('/api/suppliers', supplierRoutes);

// Audit Log Routes (NEW)
app.use('/api/audit-logs', auditLogRoutes);

// Data Export Routes (NEW)
app.use('/api/export', exportRoutes);

// ============================================
// Error Handling
// ============================================

// 404 Not Found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Global error handler
app.use(errorHandler);

// ============================================
// Server Start
// ============================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`✓ POS System Backend started on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ Frontend URL(s): ${allowedOrigins.join(', ') || 'http://localhost:3000'}`);
  console.log(`✓ Database: ${process.env.DB_NAME || 'pos_system'}`);
  console.log('='.repeat(50));
  console.log('Available API Routes:');
  console.log('  POST   /api/auth/register');
  console.log('  POST   /api/auth/login');
  console.log('  GET    /api/products');
  console.log('  POST   /api/sales');
  console.log('  POST   /api/payments');
  console.log('  GET    /api/reports/*');
  console.log('='.repeat(50));
});

module.exports = app;
