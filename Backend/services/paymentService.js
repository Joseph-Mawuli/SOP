// services/paymentService.js
// Payment Processing Business Logic

const { query } = require("../config/database");
const paystackClient = require("../config/paystack");

// Process Payment
const processPayment = async (paymentData) => {
 try {
  // Validate payment method
  const validMethods = ["cash", "mobile_money", "card", "split"];
  if (!validMethods.includes(paymentData.payment_method)) {
   throw { message: "Invalid payment method" };
  }

  // Get sale to verify amount
  const saleResult = await query("SELECT total_amount FROM sales WHERE sale_id = $1", [paymentData.sale_id]);

  if (saleResult.rows.length === 0) {
   throw { message: "Sale not found" };
  }

  const saleTotal = parseFloat(saleResult.rows[0].total_amount);

  // Calculate change
  const amountPaid = parseFloat(paymentData.amount_paid);
  if (amountPaid < saleTotal) {
   throw { message: "Amount paid is less than sale total" };
  }

  const changeAmount = amountPaid - saleTotal;

  // Check if payment already exists (e.g., from Paystack initialization)
  const existingPayment = await query("SELECT payment_id FROM payments WHERE sale_id = $1", [paymentData.sale_id]);

  let result;

  if (existingPayment.rows.length > 0) {
   // Update existing payment (for Paystack payments)
   result = await query(
    `UPDATE payments 
         SET payment_method = $2, amount_paid = $3, change_amount = $4, 
             payment_status = 'completed', payment_details = $5
         WHERE sale_id = $1
         RETURNING *`,
    [
     paymentData.sale_id,
     paymentData.payment_method,
     amountPaid,
     changeAmount,
     JSON.stringify(paymentData.payment_details || {}),
    ],
   );
  } else {
   // Insert new payment (for cash/manual payments)
   result = await query(
    `INSERT INTO payments (sale_id, payment_method, amount_paid, change_amount, payment_status, payment_details)
         VALUES ($1, $2, $3, $4, 'completed', $5)
         RETURNING *`,
    [
     paymentData.sale_id,
     paymentData.payment_method,
     amountPaid,
     changeAmount,
     JSON.stringify(paymentData.payment_details || {}),
    ],
   );
  }

  return result.rows[0];
 } catch (error) {
  throw error;
 }
};

// Get Payment by Sale ID
const getPaymentBySaleId = async (saleId) => {
 try {
  const result = await query("SELECT * FROM payments WHERE sale_id = $1", [saleId]);

  if (result.rows.length === 0) {
   return null;
  }

  return result.rows[0];
 } catch (error) {
  throw error;
 }
};

// Get Payment by Payment ID
const getPaymentById = async (paymentId) => {
 try {
  const result = await query("SELECT * FROM payments WHERE payment_id = $1", [paymentId]);

  if (result.rows.length === 0) {
   throw { message: "Payment not found" };
  }

  return result.rows[0];
 } catch (error) {
  throw error;
 }
};

// Get Payment History
const getPaymentHistory = async (filters = {}) => {
 try {
  let query_text =
   "SELECT p.*, s.transaction_id, s.total_amount FROM payments p JOIN sales s ON p.sale_id = s.sale_id WHERE 1=1";
  const params = [];
  let paramCount = 1;

  if (filters.payment_method) {
   query_text += ` AND p.payment_method = $${paramCount}`;
   params.push(filters.payment_method);
   paramCount++;
  }

  if (filters.start_date) {
   query_text += ` AND p.created_at >= $${paramCount}::date`;
   params.push(filters.start_date);
   paramCount++;
  }

  if (filters.end_date) {
   query_text += ` AND p.created_at <= $${paramCount}::date + INTERVAL '1 day'`;
   params.push(filters.end_date);
   paramCount++;
  }

  query_text += " ORDER BY p.created_at DESC";

  const result = await query(query_text, params);
  return result.rows;
 } catch (error) {
  throw error;
 }
};

// Get Payment Statistics
const getPaymentStats = async (startDate, endDate) => {
 try {
  const result = await query(
   `SELECT 
        payment_method,
        COUNT(*) as transaction_count,
        SUM(amount_paid) as total_amount,
        SUM(change_amount) as total_change
       FROM payments
       WHERE created_at >= $1::date AND created_at < $2::date + INTERVAL '1 day'
       GROUP BY payment_method
       ORDER BY total_amount DESC`,
   [startDate, endDate],
  );

  return result.rows;
 } catch (error) {
  throw error;
 }
};

// Calculate Change
const calculateChange = (saleTotal, amountPaid) => {
 return Math.max(0, parseFloat(amountPaid) - parseFloat(saleTotal));
};

// Validate Payment Amount
const validatePaymentAmount = async (saleId, amountPaid) => {
 try {
  const result = await query("SELECT total_amount FROM sales WHERE sale_id = $1", [saleId]);

  if (result.rows.length === 0) {
   throw { message: "Sale not found" };
  }

  const saleTotal = parseFloat(result.rows[0].total_amount);
  const amount = parseFloat(amountPaid);

  return {
   isValid: amount >= saleTotal,
   saleTotal,
   amountPaid: amount,
   change: amount - saleTotal,
  };
 } catch (error) {
  throw error;
 }
};

// ==================== PAYSTACK INTEGRATION ====================

// Initialize Paystack Payment
const initializePaystackPayment = async (paymentData) => {
 try {
  const { sale_id, customer_email, amount_paid, customer_name, customer_phone } = paymentData;
    const normalizedEmail = String(customer_email || "").trim().toLowerCase();
    const numericAmount = parseFloat(amount_paid);

  // Validate email — Paystack will reject missing/invalid emails
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
   throw { message: "A valid customer email is required for Paystack payments" };
  }

    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
     throw { message: "A valid amount is required for Paystack payments" };
    }

  // Get sale details
  const saleResult = await query("SELECT total_amount, customer_id FROM sales WHERE sale_id = $1", [sale_id]);

  if (saleResult.rows.length === 0) {
   throw { message: "Sale not found" };
  }

    // Convert GHS to pesewas (Paystack requires minor currency units)
    const amountInPesewas = Math.round(numericAmount * 100);

  if (isNaN(amountInPesewas) || amountInPesewas <= 0) {
   throw { message: "Invalid sale amount" };
  }

  // ✅ FIX 2: Verify the secret key being used is a LIVE key (sk_live_...)
  // If PAYSTACK_SECRET_KEY starts with sk_test_, GHS will be rejected on live accounts.
  const secretKey = process.env.PAYSTACK_SECRET_KEY || "";
  if (!secretKey.startsWith("sk_live_")) {
   console.error(
    "❌ PAYSTACK KEY ERROR: You are using a TEST secret key (sk_test_...) but GHS requires a LIVE key (sk_live_...).",
    "\nCheck your .env file: PAYSTACK_SECRET_KEY must start with sk_live_",
   );
   throw {
    message: "Payment configuration error: Live Paystack key required for GHS transactions. Please contact support.",
   };
  }

  // Debug logging
  console.log("Paystack Payment Initialization:", {
   sale_id,
    amount_from_request_ghs: numericAmount,
   converted_to_pesewas: amountInPesewas,
    email: normalizedEmail,
   currency: "GHS",
   key_type: secretKey.startsWith("sk_live_") ? "LIVE ✅" : "TEST ❌",
  });

  // ✅ FIX 3: Build the Paystack request explicitly with all required fields
  // Paystack may reject the transaction if currency is missing or the merchant
  // account does not have GHS enabled. Ensure 'channels' is set to allow
  // mobile_money (MTN, Vodafone, AirtelTigo) which are common in Ghana.
  const paystackPayload = {
    email: normalizedEmail,
   amount: amountInPesewas, // In pesewas (smallest GHS unit)
   currency: "GHS", // Must be exactly 'GHS'
   channels: ["card", "mobile_money", "bank", "ussd"], // ✅ Include mobile_money for Ghana
   metadata: {
    sale_id,
    customer_name: customer_name || "Customer",
    customer_phone: customer_phone || "",
    custom_fields: [
     {
      display_name: "Sale ID",
      variable_name: "sale_id",
      value: sale_id,
     },
    ],
   },
  };

  // Initialize transaction with Paystack API
  let response;
  try {
   response = await paystackClient.post("/transaction/initialize", paystackPayload);
  } catch (paystackError) {
   // Extract actual error message from Paystack response
   const errData = paystackError.response?.data;
   console.error("❌ Paystack API Error Details:", {
    message: errData?.message,
    code: errData?.code,
    status: paystackError.response?.status,
    fullError: errData,
   });

   // ✅ FIX 4: Surface the exact Paystack error to help debug faster
   if (errData) {
    throw {
     message: errData.message || "Paystack API error",
     paystackCode: errData.code,
     // Common cause: "Currency not supported by merchant"
     // means GHS is not enabled on your Paystack dashboard under
     // Settings → Preferences → Currencies (check the LIVE tab, not test)
     hint:
      errData.message === "Currency not supported by merchant"
       ? "Go to Paystack Dashboard → Settings → Preferences → Currencies and enable GHS on your LIVE account."
       : null,
    };
   }
   throw { message: paystackError.message || "Failed to initialize Paystack payment" };
  }

  if (!response.data.status) {
   throw { message: response.data.message || "Failed to initialize Paystack payment" };
  }

  // ✅ FIX 5: Store payment_method as 'card' for now (correct — Paystack handles
  // method internally). Previously getPaystackPaymentDetails() queried WHERE
  // payment_method = 'paystack' but inserts use 'card' — this mismatch meant
  // getPaystackPaymentDetails always returned null. Fixed below in that function too.
  await query(
   `INSERT INTO payments (sale_id, payment_method, amount_paid, payment_status, payment_details)
       VALUES ($1, 'card', $2, 'pending', $3)`,
   [
    sale_id,
    amount_paid,
    JSON.stringify({
     paystack_reference: response.data.data.reference,
     access_code: response.data.data.access_code,
     authorization_url: response.data.data.authorization_url,
     initiated_at: new Date().toISOString(),
    }),
   ],
  );

  return {
   success: true,
   authorization_url: response.data.data.authorization_url,
   access_code: response.data.data.access_code,
   reference: response.data.data.reference,
  };
 } catch (error) {
  throw error;
 }
};

// Verify Paystack Payment
const verifyPaystackPayment = async (reference) => {
 try {
  // Verify with Paystack API
  const response = await paystackClient.get(`/transaction/verify/${reference}`);

  if (!response.data.status) {
   throw { message: "Paystack verification failed" };
  }

  const transactionData = response.data.data;

  if (transactionData.status === "success") {
   // Update payment status to completed
   const paymentResult = await query(
    `UPDATE payments 
         SET payment_status = 'completed',
             payment_details = $1,
             updated_at = NOW()
         WHERE payment_details::jsonb->>'paystack_reference' = $2
         RETURNING *`,
    [
     JSON.stringify({
      ...transactionData,
      verified_at: new Date().toISOString(),
     }),
     reference,
    ],
   );

   if (paymentResult.rows.length === 0) {
    throw { message: "Payment record not found" };
   }

   return {
    success: true,
    payment: paymentResult.rows[0],
    transaction: transactionData,
   };
  } else {
   // Update payment status to failed
   await query(
    `UPDATE payments 
         SET payment_status = 'failed',
             payment_details = $1,
             updated_at = NOW()
         WHERE payment_details::jsonb->>'paystack_reference' = $2`,
    [
     JSON.stringify({
      ...transactionData,
      verified_at: new Date().toISOString(),
     }),
     reference,
    ],
   );

   throw { message: "Payment verification failed", transaction: transactionData };
  }
 } catch (error) {
  throw error;
 }
};

// Handle Paystack Webhook
const handlePaystackWebhook = async (event_data) => {
 try {
  const { reference, status } = event_data;

  if (status === "success") {
   return await verifyPaystackPayment(reference);
  } else {
   await query(
    `UPDATE payments 
         SET payment_status = 'failed',
             updated_at = NOW()
         WHERE payment_details::jsonb->>'paystack_reference' = $1`,
    [reference],
   );

   return {
    success: false,
    message: "Payment failed",
    reference,
   };
  }
 } catch (error) {
  throw error;
 }
};

// Get Paystack Payment Details
// ✅ FIX 5 (continued): Was querying WHERE payment_method = 'paystack' but payments
// are inserted with payment_method = 'card'. Fixed to match on paystack_reference in
// the JSONB details instead, which is the reliable identifier.
const getPaystackPaymentDetails = async (saleId) => {
 try {
  const result = await query(
   `SELECT * FROM payments 
       WHERE sale_id = $1 
       AND payment_details::jsonb ? 'paystack_reference'`,
   [saleId],
  );

  if (result.rows.length === 0) {
   return null;
  }

  return result.rows[0];
 } catch (error) {
  throw error;
 }
};

module.exports = {
 processPayment,
 getPaymentBySaleId,
 getPaymentById,
 getPaymentHistory,
 getPaymentStats,
 calculateChange,
 validatePaymentAmount,
 // Paystack methods
 initializePaystackPayment,
 verifyPaystackPayment,
 handlePaystackWebhook,
 getPaystackPaymentDetails,
};
