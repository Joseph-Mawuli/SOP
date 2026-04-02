// scripts/seedTestData.js
// Seed database with test data for demonstration

const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

async function seedTestData() {
  const client = await pool.connect();
  
  try {
    console.log('Starting test data seeding...\n');
    
    await client.query('BEGIN');

    // 1. Create test users (admin and cashiers)
    console.log('Creating test users...');
    
    // Admin user
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    await client.query(
      `INSERT INTO users (username, email, password_hash, role, first_name, last_name, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       ON CONFLICT (username) DO NOTHING`,
      ['admin', 'admin@possystem.local', adminPasswordHash, 'administrator', 'Admin', 'User']
    );

    // Cashier - Kojo
    const kojoPasswordHash = await bcrypt.hash('kojo123', 10);
    const kojoResult = await client.query(
      `INSERT INTO users (username, email, password_hash, role, first_name, last_name, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       ON CONFLICT (username) DO NOTHING
       RETURNING user_id`,
      ['kojo', 'kojo@possystem.local', kojoPasswordHash, 'cashier', 'Kojo', 'Mensah']
    );
    const kojoId = kojoResult.rows.length > 0 ? kojoResult.rows[0].user_id : 1;

    // Cashier - Ama
    const amaPasswordHash = await bcrypt.hash('ama123', 10);
    await client.query(
      `INSERT INTO users (username, email, password_hash, role, first_name, last_name, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       ON CONFLICT (username) DO NOTHING`,
      ['ama', 'ama@possystem.local', amaPasswordHash, 'cashier', 'Ama', 'Owusu']
    );

    console.log('✓ Users created\n');

    // 2. Create test products
    console.log('Creating test products...');
    
    const products = [
      { name: 'Coca Cola 500ml', barcode: '5449000011116', category: 'Beverages', price: 2.50 },
      { name: 'Sprite 500ml', barcode: '5449000211111', category: 'Beverages', price: 2.50 },
      { name: 'Fanta Orange 500ml', barcode: '5449000311115', category: 'Beverages', price: 2.30 },
      { name: 'Pure Water Sachet', barcode: '5449000012345', category: 'Beverages', price: 0.30 },
      { name: 'Bread Loaf', barcode: '5449001111116', category: 'Bakery', price: 3.00 },
      { name: 'Donut (Pack of 6)', barcode: '5449001211115', category: 'Bakery', price: 4.50 },
      { name: 'Banana (per lb)', barcode: '5449002111114', category: 'Fruits', price: 1.20 },
      { name: 'Tomato (per lb)', barcode: '5449002211113', category: 'Vegetables', price: 0.80 },
      { name: 'Milk 1L', barcode: '5449003111112', category: 'Dairy', price: 5.00 },
      { name: 'Cheese Block 500g', barcode: '5449003211111', category: 'Dairy', price: 8.00 }
    ];

    const productIds = [];
    for (const product of products) {
      const result = await client.query(
        `INSERT INTO products (product_name, barcode, category, unit_price, cost_price, is_active)
         VALUES ($1, $2, $3, $4, $5, true)
         ON CONFLICT (barcode) DO NOTHING
         RETURNING product_id`,
        [product.name, product.barcode, product.category, product.price, product.price * 0.6]
      );
      if (result.rows.length > 0) {
        productIds.push(result.rows[0].product_id);
      }
    }

    console.log('✓ Products created\n');

    // 3. Create inventory for products
    console.log('Creating inventory...');
    
    for (let i = 0; i < productIds.length; i++) {
      await client.query(
        `INSERT INTO inventory (product_id, quantity_on_hand, reorder_level, reorder_quantity)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (product_id) DO NOTHING`,
        [productIds[i], 100 + (i * 10), 20, 50]
      );
    }

    console.log('✓ Inventory created\n');

    // 4. Create test customers
    console.log('Creating test customers...');
    
    const customers = [
      { name: 'John Doe', phone: '0501234567', email: 'john@email.com' },
      { name: 'Jane Smith', phone: '0502345678', email: 'jane@email.com' },
      { name: 'Michael Brown', phone: '0503456789', email: 'michael@email.com' },
      { name: 'Sarah Wilson', phone: '0504567890', email: 'sarah@email.com' },
      { name: 'David Lee', phone: '0505678901', email: 'david@email.com' }
    ];

    const customerIds = [];
    for (const customer of customers) {
      const result = await client.query(
        `INSERT INTO customers (customer_name, phone, email, is_registered)
         VALUES ($1, $2, $3, true)
         RETURNING customer_id`,
        [customer.name, customer.phone, customer.email]
      );
      if (result.rows.length > 0) {
        customerIds.push(result.rows[0].customer_id);
      }
    }

    console.log('✓ Customers created\n');

    // 5. Create test sales transactions for today and yesterday
    console.log('Creating test sales transactions...');
    
    const generateTransactionId = () => {
      const date = new Date();
      const timestamp = date.getTime().toString().slice(-8);
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `TXN${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}${timestamp}${random}`;
    };

    // Create 5 transactions for Kojo today
    const today = new Date();
    for (let i = 0; i < 5; i++) {
      const transactionId = generateTransactionId();
      const customerId = customerIds[i % customerIds.length];
      
      // Random items
      const numItems = Math.floor(Math.random() * 3) + 1;
      let subtotal = 0;
      const items = [];
      
      for (let j = 0; j < numItems; j++) {
        const productId = productIds[Math.floor(Math.random() * productIds.length)];
        const quantity = Math.floor(Math.random() * 5) + 1;
        const unitPrice = 2.50 + (Math.random() * 5);
        const itemTotal = quantity * unitPrice;
        subtotal += itemTotal;
        items.push({ productId, quantity, unitPrice, itemTotal });
      }
      
      const discountAmount = Math.random() > 0.7 ? subtotal * 0.1 : 0;
      const taxAmount = (subtotal - discountAmount) * 0.10;
      const totalAmount = subtotal - discountAmount + taxAmount;

      // Insert sale
      const saleResult = await client.query(
        `INSERT INTO sales (transaction_id, cashier_id, customer_id, subtotal, discount_amount, tax_amount, total_amount, sale_status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed', CURRENT_TIMESTAMP)
         RETURNING sale_id`,
        [transactionId, kojoId, customerId, subtotal, discountAmount, taxAmount, totalAmount]
      );

      const saleId = saleResult.rows[0].sale_id;

      // Insert sale items and deduct from inventory
      for (const item of items) {
        await client.query(
          `INSERT INTO sales_items (sale_id, product_id, quantity, unit_price, item_total)
           VALUES ($1, $2, $3, $4, $5)`,
          [saleId, item.productId, item.quantity, item.unitPrice, item.itemTotal]
        );

        await client.query(
          `UPDATE inventory SET quantity_on_hand = quantity_on_hand - $1 WHERE product_id = $2`,
          [item.quantity, item.productId]
        );
      }

      // Insert payment
      await client.query(
        `INSERT INTO payments (sale_id, payment_method, amount_paid, created_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
        [saleId, ['cash', 'mobile_money'][Math.floor(Math.random() * 2)], totalAmount]
      );
    }

    console.log('✓ Created 5 sales transactions for Kojo today\n');

    // 6. Create 3 transactions for yesterday (Kojo)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    for (let i = 0; i < 3; i++) {
      const transactionId = generateTransactionId();
      const customerId = customerIds[(i + 2) % customerIds.length];
      
      const numItems = Math.floor(Math.random() * 3) + 1;
      let subtotal = 0;
      const items = [];
      
      for (let j = 0; j < numItems; j++) {
        const productId = productIds[Math.floor(Math.random() * productIds.length)];
        const quantity = Math.floor(Math.random() * 5) + 1;
        const unitPrice = 2.50 + (Math.random() * 5);
        const itemTotal = quantity * unitPrice;
        subtotal += itemTotal;
        items.push({ productId, quantity, unitPrice, itemTotal });
      }
      
      const discountAmount = Math.random() > 0.7 ? subtotal * 0.1 : 0;
      const taxAmount = (subtotal - discountAmount) * 0.10;
      const totalAmount = subtotal - discountAmount + taxAmount;

      const saleResult = await client.query(
        `INSERT INTO sales (transaction_id, cashier_id, customer_id, subtotal, discount_amount, tax_amount, total_amount, sale_status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed', $8)
         RETURNING sale_id`,
        [transactionId, kojoId, customerId, subtotal, discountAmount, taxAmount, totalAmount, yesterday.toISOString()]
      );

      const saleId = saleResult.rows[0].sale_id;

      for (const item of items) {
        await client.query(
          `INSERT INTO sales_items (sale_id, product_id, quantity, unit_price, item_total)
           VALUES ($1, $2, $3, $4, $5)`,
          [saleId, item.productId, item.quantity, item.unitPrice, item.itemTotal]
        );

        await client.query(
          `UPDATE inventory SET quantity_on_hand = quantity_on_hand - $1 WHERE product_id = $2`,
          [item.quantity, item.productId]
        );
      }

      await client.query(
        `INSERT INTO payments (sale_id, payment_method, amount_paid, created_at)
         VALUES ($1, $2, $3, $4)`,
        [saleId, ['cash', 'mobile_money'][Math.floor(Math.random() * 2)], totalAmount, yesterday.toISOString()]
      );
    }

    console.log('✓ Created 3 sales transactions for Kojo yesterday\n');

    await client.query('COMMIT');
    console.log('✓ Test data seeding completed successfully!');
    console.log('\nTest Credentials:');
    console.log('  Admin: admin / admin123');
    console.log('  Cashier (Kojo): kojo / kojo123');
    console.log('  Cashier (Ama): ama / ama123');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('✗ Error seeding test data:', error.message);
    if (error.detail) console.error('Detail:', error.detail);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedTestData();
