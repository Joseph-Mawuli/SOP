// services/receiptService.js
// Receipt Generation Business Logic

const { query } = require('../config/database');

// Generate Receipt Data
const generateReceipt = async (saleId) => {
  try {
    // Get sale details
    const saleResult = await query(
      `SELECT s.*, u.username as cashier_name, u.first_name, u.last_name
       FROM sales s
       JOIN users u ON s.cashier_id = u.user_id
       WHERE s.sale_id = $1`,
      [saleId]
    );

    if (saleResult.rows.length === 0) {
      throw { message: 'Sale not found' };
    }

    const sale = saleResult.rows[0];

    // Get customer details if available
    let customer = null;
    if (sale.customer_id) {
      const customerResult = await query(
        'SELECT * FROM customers WHERE customer_id = $1',
        [sale.customer_id]
      );

      if (customerResult.rows.length > 0) {
        customer = customerResult.rows[0];
      }
    }

    // Get sale items
    const itemsResult = await query(
      `SELECT si.*, p.product_name, p.barcode, p.category
       FROM sales_items si
       JOIN products p ON si.product_id = p.product_id
       WHERE si.sale_id = $1`,
      [saleId]
    );

    const items = itemsResult.rows;

    // Get payment details
    let payment = null;
    const paymentResult = await query(
      'SELECT * FROM payments WHERE sale_id = $1',
      [saleId]
    );

    if (paymentResult.rows.length > 0) {
      payment = paymentResult.rows[0];
    }

    // Format receipt
    const receipt = {
      store_name: process.env.APP_NAME || 'POS System Store',
      transaction_id: sale.transaction_id,
      cashier: sale.cashier_name,
      date: formatDate(sale.created_at),
      time: formatTime(sale.created_at),
      customer: customer ? {
        name: customer.customer_name,
        email: customer.email,
        loyalty_points: customer.loyalty_points
      } : null,
      items: items.map(item => ({
        name: item.product_name,
        barcode: item.barcode,
        category: item.category,
        quantity: item.quantity,
        unit_price: parseFloat(item.unit_price).toFixed(2),
        total: parseFloat(item.item_total).toFixed(2)
      })),
      subtotal: parseFloat(sale.subtotal).toFixed(2),
      discount: parseFloat(sale.discount_amount).toFixed(2),
      tax: parseFloat(sale.tax_amount).toFixed(2),
      total: parseFloat(sale.total_amount).toFixed(2),
      payment: payment ? {
        method: payment.payment_method,
        amount_paid: parseFloat(payment.amount_paid).toFixed(2),
        change: parseFloat(payment.change_amount).toFixed(2)
      } : null,
      item_count: items.length,
      currency: process.env.CURRENCY || 'USD'
    };

    return receipt;
  } catch (error) {
    throw error;
  }
};

// Format Date
const formatDate = (date) => {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

// Format Time
const formatTime = (date) => {
  const d = new Date(date);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
};

// Generate Receipt Text (for printing)
const generateReceiptText = (receipt) => {
  let text = '';

  // Header
  text += '='.repeat(40) + '\n';
  text += centerText(receipt.store_name, 40) + '\n';
  text += '='.repeat(40) + '\n';

  // Transaction Info
  text += `Transaction: ${receipt.transaction_id}\n`;
  text += `Date: ${receipt.date} ${receipt.time}\n`;
  text += `Cashier: ${receipt.cashier}\n`;

  if (receipt.customer) {
    text += `Customer: ${receipt.customer.name}\n`;
    text += `Loyalty Points: ${receipt.customer.loyalty_points}\n`;
  }

  text += '\n' + '-'.repeat(40) + '\n';

  // Items
  text += 'ITEMS\n';
  text += '-'.repeat(40) + '\n';

  for (const item of receipt.items) {
    text += `${item.name}\n`;
    text += `  Qty: ${item.quantity} x ${receipt.currency}${item.unit_price} = ${receipt.currency}${item.total}\n`;
  }

  text += '\n' + '-'.repeat(40) + '\n';

  // Totals
  text += `Subtotal: ${' '.repeat(28)}${receipt.currency}${receipt.subtotal}\n`;

  if (parseFloat(receipt.discount) > 0) {
    text += `Discount: ${' '.repeat(28)}${receipt.currency}-${receipt.discount}\n`;
  }

  if (parseFloat(receipt.tax) > 0) {
    text += `Tax: ${' '.repeat(33)}${receipt.currency}${receipt.tax}\n`;
  }

  text += 'TOTAL: ' + ' '.repeat(34) + `${receipt.currency}${receipt.total}\n`;

  text += '\n' + '-'.repeat(40) + '\n';

  // Payment
  if (receipt.payment) {
    text += `Payment Method: ${receipt.payment.method.toUpperCase()}\n`;
    text += `Amount Paid: ${' '.repeat(28)}${receipt.currency}${receipt.payment.amount_paid}\n`;
    text += `Change: ${' '.repeat(32)}${receipt.currency}${receipt.payment.change}\n`;
  }

  text += '\n' + '='.repeat(40) + '\n';
  text += centerText('Thank You!', 40) + '\n';
  text += centerText('Please Visit Again', 40) + '\n';
  text += '='.repeat(40) + '\n';

  return text;
};

// Center Text
const centerText = (text, width) => {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(padding) + text;
};

// Get Recent Receipts
const getRecentReceipts = async (limit = 10) => {
  try {
    const result = await query(
      `SELECT s.sale_id, s.transaction_id, s.created_at
       FROM sales s
       ORDER BY s.created_at DESC
       LIMIT $1`,
      [limit]
    );

    const receipts = [];
    for (const row of result.rows) {
      const receipt = await generateReceipt(row.sale_id);
      receipts.push(receipt);
    }

    return receipts;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  generateReceipt,
  generateReceiptText,
  getRecentReceipts,
  formatDate,
  formatTime
};
