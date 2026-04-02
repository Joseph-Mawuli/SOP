# NEXUS POS - Point of Sale System

A modern, comprehensive **Point of Sale (POS) system** designed for retail businesses with inventory management, sales processing, customer CRM, reporting, and secure multi-user access control.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [User Roles & Permissions](#user-roles--permissions)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## 🎯 Overview

NEXUS POS is a **three-tier web application** built for retail management with:
- ✅ Secure user authentication (JWT-based)
- ✅ Real-time inventory tracking
- ✅ Point-of-sale checkout system
- ✅ Customer relationship management (CRM)
- ✅ Dynamic reporting and analytics
- ✅ Multi-role access control (Admin, Cashier)
- ✅ Dark/Light theme support
- ✅ Receipt printing functionality

---

## ✨ Key Features

### 1. **User Management & Authentication**
- Role-based access control (Admin, Cashier)
- Secure password hashing with bcryptjs
- JWT token-based authentication
- User activity logging

### 2. **Point of Sale**
- Real-time cart management
- Product search and filtering
- Barcode scanning support
- Multiple payment methods
- Automatic change calculation
- Receipt generation and printing

### 3. **Product Management**
- Add, edit, delete products
- Product categorization
- Barcode management
- SKU tracking
- Price management
- Stock level monitoring

### 4. **Inventory Management**
- Real-time stock tracking
- Low stock alerts
- Stock adjustments (add/remove)
- Inventory history
- Automatic deduction on sales

### 5. **Customer Management**
- Customer registration
- Loyalty points system
- Purchase history tracking
- Customer details view
- Customer segmentation

### 6. **Sales & Payments**
- Complete transaction processing
- Multiple payment methods (Cash, Card, Check, etc.)
- Automatic payment reconciliation
- Sales history and tracking
- Transaction receipts

### 7. **Reporting & Analytics**
- Daily sales reports
- Product performance analysis
- Inventory reports
- Customer analytics
- Payment reconciliation reports
- Custom date range filtering

---

## 🛠 Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Responsive design with CSS variables for theming
- **Vanilla JavaScript (ES6+)** - No framework dependencies
- **Local Storage** - Client-side session management
- **Print API** - Receipt printing

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Relational database
- **JWT (jsonwebtoken)** - Authentication tokens
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **CORS** - Cross-origin resource sharing

### Development Tools
- **nodemon** - Auto-reload on file changes
- **dotenv** - Environment variable management

---

## 📁 Project Structure

```
SOP/
├── Backend/
│   ├── config/
│   │   └── database.js              # Database configuration
│   ├── controllers/
│   │   ├── authController.js        # Authentication handlers
│   │   ├── customerController.js    # Customer management
│   │   ├── inventoryController.js   # Inventory operations
│   │   ├── paymentController.js     # Payment processing
│   │   ├── productController.js     # Product management
│   │   ├── receiptController.js     # Receipt generation
│   │   ├── reportController.js      # Reports
│   │   ├── salesController.js       # Sales transactions
│   │   └── userController.js        # User management
│   ├── middleware/
│   │   ├── auth.js                  # JWT verification
│   │   ├── errorHandler.js          # Centralized error handling
│   │   └── validation.js            # Request validation
│   ├── routes/
│   │   ├── authRoutes.js            # /api/auth
│   │   ├── customerRoutes.js        # /api/customers
│   │   ├── inventoryRoutes.js       # /api/inventory
│   │   ├── paymentRoutes.js         # /api/payments
│   │   ├── productRoutes.js         # /api/products
│   │   ├── receiptRoutes.js         # /api/receipts
│   │   ├── reportRoutes.js          # /api/reports
│   │   ├── salesRoutes.js           # /api/sales
│   │   └── userRoutes.js            # /api/users
│   ├── services/
│   │   ├── authService.js           # Auth business logic
│   │   ├── customerService.js       # Customer operations
│   │   ├── inventoryService.js      # Inventory logic
│   │   ├── paymentService.js        # Payment processing
│   │   ├── productService.js        # Product operations
│   │   ├── receiptService.js        # Receipt generation
│   │   ├── reportService.js         # Report generation
│   │   ├── salesService.js          # Sales processing
│   │   └── userService.js           # User operations
│   ├── scripts/
│   │   ├── initDatabase.js          # Database initialization
│   │   └── resetDatabase.js         # Reset database (dev)
│   ├── database_schema.sql          # Full DB schema
│   ├── server.js                    # Express app entry point
│   ├── package.json                 # Backend dependencies
│   └── .env                         # Environment variables
│
├── frontend/
│   ├── index.html                   # Main application shell
│   ├── app.js                       # Core business logic (~1600 lines)
│   ├── app-part2.js                 # Additional features (legacy)
│   ├── api.js                       # Backend API client abstraction
│   ├── styles.css                   # Responsive styles + theming
│   └── assets/                      # Images, icons, fonts
│
├── SYSTEM_ARCHITECTURE.md           # Detailed architecture documentation
└── README.md                        # This file
```

---

## 🚀 Installation

### Prerequisites
- **Node.js** (v14+)
- **PostgreSQL** (v12+)
- **npm** or **yarn**
- **Git**

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd SOP
```

### Step 2: Setup Backend Environment

```bash
cd Backend
npm install
```

Create a `.env` file in the `Backend` directory:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pos_system
DB_USER=postgres
DB_PASSWORD=your_password

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_32_characters_minimum
JWT_EXPIRE=24h

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### Step 3: Initialize the Database

```bash
# Create the database and schema
npm run init-db
```

This will:
- Create the PostgreSQL database
- Initialize all tables (users, products, inventory, sales, etc.)
- Insert default admin user

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin123`
⚠️ **Change these immediately in production!**

### Step 4: Start the Backend Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Backend should now be running on `http://localhost:5000`

### Step 5: Run the Frontend

Open `frontend/index.html` directly in your browser or serve it via a static server:

```bash
# If you have Python installed
cd frontend
python -m http.server 3000

# Or use another static server
npx serve frontend
```

Frontend should now be accessible at `http://localhost:3000`

---

## ⚙️ Configuration

### Backend Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `DB_HOST` | PostgreSQL hostname | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `pos_system` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `secure_password` |
| `PORT` | Express server port | `5000` |
| `NODE_ENV` | Environment type | `development` \| `production` |
| `JWT_SECRET` | JWT signing key | `min_32_chars_recommended` |
| `JWT_EXPIRE` | Token expiration | `24h` \| `7d` |
| `FRONTEND_URL` | Frontend origin for CORS | `http://localhost:3000` |

### Database Configuration

Edit `Backend/config/database.js` to customize connection pool settings:

```javascript
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,                    // Max connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000,
});
```

---

## 📖 Usage

### Logging In

1. Open the application in your browser
2. Enter credentials for your role:
   - **Admin**: Full system access
   - **Cashier**: POS & sales only
3. Click "Login"

### Processing a Sale

1. Go to **POS** page
2. Search and select products
3. Adjust quantities as needed
4. Add customer (optional - for loyalty points tracking)
5. Select payment method
6. Process payment
7. Print receipt

### Managing Inventory

1. Go to **Inventory** page (Admin only)
2. View current stock levels
3. Click "Adjust Stock" to modify quantities
4. Search products by name or category

### Viewing Reports

1. Go to **Reports** page
2. Select date range
3. Choose report type:
   - Daily Sales Performance
   - Product Performance
   - Customer Analytics
   - Inventory Status
   - Payment Reconciliation

### Managing Customers

1. Go to **Customers** page
2. Click **"+ Add Customer"** to register new customer
3. Enter name, email, phone, and loyalty points
4. Click view to see:
   - Customer details
   - Purchase history
   - Loyalty points balance
   - Total purchases
5. Edit or delete customer as needed

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/login           - User login
POST   /api/auth/logout          - User logout
GET    /api/auth/verify          - Verify JWT token
```

### Users
```
GET    /api/users                - List all users
POST   /api/users                - Create new user
GET    /api/users/:id            - Get user details
PUT    /api/users/:id            - Update user
DELETE /api/users/:id            - Delete user
```

### Products
```
GET    /api/products             - List all products
POST   /api/products             - Create product
PUT    /api/products/:id         - Update product
DELETE /api/products/:id         - Delete product
GET    /api/products/search      - Search products by name
```

### Inventory
```
GET    /api/inventory            - Get stock levels
PUT    /api/inventory/:id        - Adjust stock
GET    /api/inventory/low-stock  - Get low stock items
```

### Sales
```
POST   /api/sales                - Create sale transaction
GET    /api/sales                - Get sales history
GET    /api/sales/:id            - Get sale details
```

### Customers
```
GET    /api/customers            - List customers
POST   /api/customers            - Register/create customer
GET    /api/customers/:id        - Get customer details
PUT    /api/customers/:id        - Update customer
DELETE /api/customers/:id        - Delete customer
GET    /api/customers/:id/history - Get purchase history
POST   /api/customers/:id/loyalty - Add loyalty points
```

### Payments
```
POST   /api/payments             - Process payment
GET    /api/payments             - Get payment history
```

### Reports
```
GET    /api/reports/daily-sales  - Daily sales report
GET    /api/reports/products     - Product performance
GET    /api/reports/inventory    - Inventory status
GET    /api/reports/customers    - Customer analytics
```

### Receipts
```
POST   /api/receipts             - Generate receipt
GET    /api/receipts/:id         - Get receipt details
```

---

## 🗄️ Database Schema

### Core Tables

#### `users`
- Stores user accounts with roles and authentication
- Fields: user_id, username, email, password_hash, role, first_name, last_name, is_active

#### `products`
- Product catalog with pricing and categorization
- Fields: product_id, product_name, barcode, category, unit_price, tax_rate, created_at

#### `inventory`
- Stock tracking per product
- Fields: inventory_id, product_id, quantity_on_hand, reorder_level, last_updated

#### `customers`
- Customer profiles with loyalty tracking
- Fields: customer_id, customer_name, phone, email, loyalty_points, total_purchases, is_registered

#### `sales`
- Sales transactions with items and totals
- Fields: sale_id, transaction_id, customer_id (FK), cashier_id (FK), total_amount, sale_status

#### `sales_items`
- Individual items in each sale
- Fields: sale_item_id, sale_id (FK), product_id (FK), quantity, unit_price, subtotal

#### `payments`
- Payment records for sales
- Fields: payment_id, sale_id (FK), payment_method, amount_paid, change_amount

#### `receipts`
- Receipt data for printing and history
- Fields: receipt_id, sale_id (FK), receipt_data, created_at

---

## 👥 User Roles & Permissions

### Admin
- ✅ All permissions
- ✅ User management
- ✅ Product management
- ✅ Inventory management
- ✅ View all reports
- ✅ System configuration

### Cashier
- ✅ POS operations
- ✅ Process sales
- ✅ View own sales history
- ✅ Customer lookup (read-only)
- ✅ Receipt printing
- ❌ Product management
- ❌ User management
- ❌ Report viewing

---

## 🔒 Security Features

- **Password Hashing**: bcryptjs with salt rounds (10)
- **JWT Authentication**: Stateless token-based auth with expiration
- **CORS Protection**: Configurable origin restrictions
- **Input Validation**: Sanitization and type checking on all inputs
- **SQL Injection Prevention**: Parameterized queries using PostgreSQL driver
- **Rate Limiting**: (Recommended to add in production)
- **HTTPS/TLS**: (Recommended for production deployment)

---

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check if port is already in use
# Error: listen EADDRINUSE :::5000
lsof -i :5000
kill -9 <PID>

# Verify environment variables
echo $DB_HOST
echo $DB_NAME
```

### Database Connection Failed
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Verify credentials in .env file
# Check PostgreSQL user exists
psql -U postgres -c "SELECT 1"
```

### JWT Authentication Errors
```
# "No token provided" → Frontend not sending Authorization header
# Check browser console for failed API requests

# "Invalid token" → Token expired or corrupted
# Clear Local Storage and login again
localStorage.clear()
```

### CORS Errors
```
# "Access to XMLHttpRequest blocked by CORS policy"
# Update FRONTEND_URL in Backend/.env to match your frontend origin
# Restart backend server after changing .env
```

### Customer Delete Not Working
```
# Hard refresh browser to clear JavaScript cache
Windows/Linux: Ctrl+Shift+R
Mac: Cmd+Shift+R

# Check browser console (F12) for JavaScript errors
# Verify backend server is running
```

### Sales Not Updating Customer Total Purchases
```
# Restart backend server to load updated salesService.js
npm run dev

# Check if customer_id is being sent with sale
# Verify database has the sales → customers transaction
```

---

## 📊 Sample Data

After running `npm run init-db`, the system includes:

**Default Admin User:**
```
Username: admin
Password: admin123
Role: admin
```

**Sample Products:** Grocery items with pricing and tax rates

**Sample Inventory:** Stock levels across categories

⚠️ **Important**: Change the default admin password immediately in production!

---

## 🚀 Deployment

### Production Checklist

- [ ] Update `.env` with production database credentials
- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET` (32+ characters)
- [ ] Enable HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Enable CORS for production domain only
- [ ] Remove debug logging
- [ ] Set up monitoring and alerting
- [ ] Use process manager (PM2, systemd)

### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start backend with PM2
pm2 start Backend/server.js --name "pos-backend"

# Auto-start on system reboot
pm2 startup
pm2 save

# Monitor
pm2 monitor
pm2 logs pos-backend
```

### Docker Deployment (Optional)

Create `Backend/Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

---

## 📝 API Response Format

All API responses follow a consistent format:

**Success Response (2xx):**
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully"
}
```

**Error Response (4xx, 5xx):**
```json
{
  "success": false,
  "error": "Detailed error message",
  "status": 400
}
```

---

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit changes (`git commit -m 'Add AmazingFeature'`)
3. Push to branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 📞 Support & Contact

For issues, questions, or suggestions, please:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md) for detailed design docs
3. Check browser console (F12) for error messages
4. Review backend logs in terminal

---

## 🎯 Future Enhancements

- [ ] Real-time inventory sync across multiple locations
- [ ] Advanced analytics with dashboards
- [ ] Mobile app for cashiers
- [ ] Multi-language support
- [ ] Vendor management system
- [ ] Loyalty program integration with SMS
- [ ] API rate limiting
- [ ] Two-factor authentication (2FA)
- [ ] Automated backup system
- [ ] Unit tests and integration tests

---

**Last Updated**: March 25, 2026  
**Version**: 1.0.0  
**Status**: Production Ready
