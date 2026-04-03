// controllers/paymentController.js
// Payment Processing Route Handlers

const paymentService = require("../services/paymentService");
const auditLogService = require("../services/auditLogService");
const crypto = require("crypto"); // ✅ FIX 1: Needed for webhook signature verification

// Process Payment
const processPayment = async (req, res, next) => {
 try {
  const { sale_id, payment_method, amount_paid, payment_details } = req.body;

  if (!sale_id || !payment_method || !amount_paid) {
   return res.status(400).json({
    success: false,
    message: "Sale ID, payment method, and amount are required",
   });
  }

  // ✅ FIX 2: Validate payment_method against allowed values here in the controller
  // so bad requests are rejected before hitting the service layer.
  const validMethods = ["cash", "mobile_money", "card", "split", "paystack"];
  if (!validMethods.includes(payment_method)) {
   return res.status(400).json({
    success: false,
    message: "Invalid payment method. Must be cash, mobile_money, card, split, or paystack",
   });
  }

  const payment = await paymentService.processPayment({
   sale_id,
   payment_method,
   amount_paid,
   payment_details,
  });

  // Log audit trail
  try {
   await auditLogService.logAction({
    user_id: req.user.user_id,
    action: "CREATE",
    entity_type: "payment",
    entity_id: payment.payment_id,
    old_values: null,
    new_values: { sale_id, payment_method, amount_paid },
    ip_address: req.ip,
    user_agent: req.get("user-agent"),
    status: "success",
   });
  } catch (auditError) {
   console.error("Audit logging error:", auditError);
  }

  res.status(201).json({
   success: true,
   message: "Payment processed successfully",
   data: payment,
  });
 } catch (error) {
  console.error("Process payment error:", error);
  res.status(400).json({
   success: false,
   message: error.message || "Payment processing failed",
  });
 }
};

// Get Payment by ID
const getPaymentById = async (req, res, next) => {
 try {
  const { id } = req.params;

  // ✅ FIX 3: Original had no guard — passing a non-numeric id like "paystack"
  // (from route shadowing) would cause a DB error instead of a clean 400 response.
  if (!id || isNaN(Number(id))) {
   return res.status(400).json({
    success: false,
    message: "Invalid payment ID",
   });
  }

  const payment = await paymentService.getPaymentById(id);

  res.status(200).json({
   success: true,
   data: payment,
  });
 } catch (error) {
  console.error("Get payment error:", error);
  res.status(404).json({
   success: false,
   message: error.message || "Payment not found",
  });
 }
};

// Get Payment by Sale ID
const getPaymentBySaleId = async (req, res, next) => {
 try {
  const { saleId } = req.params;

  const payment = await paymentService.getPaymentBySaleId(saleId);

  if (!payment) {
   return res.status(404).json({
    success: false,
    message: "Payment not found",
   });
  }

  res.status(200).json({
   success: true,
   data: payment,
  });
 } catch (error) {
  console.error("Get payment by sale error:", error);
  res.status(500).json({
   success: false,
   message: error.message || "Failed to get payment",
  });
 }
};

// Get Payment History
const getPaymentHistory = async (req, res, next) => {
 try {
  const { payment_method, start_date, end_date } = req.query;

  // ✅ FIX 4: Validate date format if provided, to prevent DB errors from
  // malformed date strings being passed directly into SQL queries.
  if (start_date && isNaN(Date.parse(start_date))) {
   return res.status(400).json({
    success: false,
    message: "Invalid start_date format. Use YYYY-MM-DD",
   });
  }
  if (end_date && isNaN(Date.parse(end_date))) {
   return res.status(400).json({
    success: false,
    message: "Invalid end_date format. Use YYYY-MM-DD",
   });
  }

  const history = await paymentService.getPaymentHistory({
   payment_method,
   start_date,
   end_date,
  });

  res.status(200).json({
   success: true,
   count: history.length,
   data: history,
  });
 } catch (error) {
  console.error("Get payment history error:", error);
  res.status(500).json({
   success: false,
   message: error.message || "Failed to get history",
  });
 }
};

// Get Payment Statistics
const getPaymentStats = async (req, res, next) => {
 try {
  const { start_date, end_date } = req.query;

  if (!start_date || !end_date) {
   return res.status(400).json({
    success: false,
    message: "Start date and end date are required",
   });
  }

  // ✅ FIX 4 (same): Validate date format for stats too
  if (isNaN(Date.parse(start_date)) || isNaN(Date.parse(end_date))) {
   return res.status(400).json({
    success: false,
    message: "Invalid date format. Use YYYY-MM-DD",
   });
  }

  const stats = await paymentService.getPaymentStats(start_date, end_date);

  res.status(200).json({
   success: true,
   data: stats,
  });
 } catch (error) {
  console.error("Get payment stats error:", error);
  res.status(500).json({
   success: false,
   message: error.message || "Failed to get statistics",
  });
 }
};

// ==================== PAYSTACK INTEGRATION ENDPOINTS ====================

// Initialize Paystack Payment
const initializePaystackPayment = async (req, res, next) => {
 try {
  const { sale_id, customer_email, amount_paid, customer_name, customer_phone } = req.body;

  if (!sale_id || !customer_email || !amount_paid) {
   return res.status(400).json({
    success: false,
    message: "Sale ID, customer email, and amount are required",
   });
  }

  // ✅ FIX 5: Validate email format early before hitting Paystack API.
  // Paystack returns a vague error when email is invalid — catch it here first.
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(customer_email)) {
   return res.status(400).json({
    success: false,
    message: "Invalid customer email address",
   });
  }

  const result = await paymentService.initializePaystackPayment({
   sale_id,
   customer_email,
   amount_paid,
   customer_name,
   customer_phone,
  });

  // Log audit trail
  try {
   if (req.user && req.user.user_id) {
    await auditLogService.logAction({
     user_id: req.user.user_id,
     action: "CREATE",
     entity_type: "paystack_payment",
        entity_id: Number(sale_id),
     old_values: null,
        new_values: { sale_id, customer_email, amount_paid, paystack_reference: result.reference },
     ip_address: req.ip,
     user_agent: req.get("user-agent"),
     status: "success",
    });
   }
  } catch (auditError) {
   console.error("Audit logging error:", auditError);
  }

  res.status(200).json({
   success: true,
   message: "Paystack payment initialized",
   data: result,
  });
 } catch (error) {
  console.error("Initialize Paystack payment error:", {
   message: error.message,
   paystackCode: error.paystackCode,
   hint: error.hint,
  });

  // ✅ FIX 6: Surface the hint from paymentService so the frontend can show
  // a meaningful error (e.g. "GHS not enabled") instead of a generic message.
  res.status(400).json({
   success: false,
   message: error.message || "Failed to initialize payment",
   code: error.paystackCode || null,
   hint: error.hint || null,
  });
 }
};

// Verify Paystack Payment
const verifyPaystackPayment = async (req, res, next) => {
 try {
  const { reference } = req.params;

  if (!reference) {
   return res.status(400).json({
    success: false,
    message: "Payment reference is required",
   });
  }

  const result = await paymentService.verifyPaystackPayment(reference);

  // Log audit trail
  try {
   await auditLogService.logAction({
    user_id: req.user?.user_id || null,
    action: "UPDATE",
    entity_type: "paystack_payment",
    entity_id: result?.payment?.sale_id ? Number(result.payment.sale_id) : null,
    old_values: null,
    new_values: { status: "verified", paystack_reference: reference },
    ip_address: req.ip,
    user_agent: req.get("user-agent"),
    status: "success",
   });
  } catch (auditError) {
   console.error("Audit logging error:", auditError);
  }

  res.status(200).json({
   success: true,
   message: "Payment verified successfully",
   data: result,
  });
 } catch (error) {
  console.error("Verify Paystack payment error:", error);
  res.status(400).json({
   success: false,
   message: error.message || "Failed to verify payment",
  });
 }
};

// Handle Paystack Webhook
const handlePaystackWebhook = async (req, res, next) => {
 try {
  // ✅ FIX 1: Verify Paystack webhook signature BEFORE processing anything.
  // Without this, anyone can POST to your webhook URL and fake a payment success.
  // Paystack signs every webhook with your secret key using HMAC SHA512.
  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  const signature = req.headers["x-paystack-signature"];

  if (!signature || !paystackSecret) {
   console.error("Webhook rejected: missing signature or secret key");
   return res.status(401).json({
    success: false,
    message: "Unauthorized webhook request",
   });
  }

  const expectedSignature = crypto.createHmac("sha512", paystackSecret).update(JSON.stringify(req.body)).digest("hex");

  if (signature !== expectedSignature) {
   console.error("Webhook rejected: signature mismatch");
   return res.status(401).json({
    success: false,
    message: "Invalid webhook signature",
   });
  }

  // ✅ FIX 7: Paystack expects a 200 response IMMEDIATELY — if your processing
  // takes too long, Paystack will retry the webhook repeatedly. Acknowledge first,
  // then process asynchronously.
  res.status(200).json({ success: true, message: "Webhook received" });

  // Process webhook asynchronously after responding
  try {
   await paymentService.handlePaystackWebhook(req.body);
  } catch (processError) {
   console.error("Webhook processing error (after 200 sent):", processError);
  }
 } catch (error) {
  console.error("Handle Paystack webhook error:", error);
  // Only send a response if we haven't already sent the 200
  if (!res.headersSent) {
   res.status(400).json({
    success: false,
    message: error.message || "Failed to handle webhook",
   });
  }
 }
};

// Get Paystack Payment Details
const getPaystackPaymentDetails = async (req, res, next) => {
 try {
  const { saleId } = req.params;

  const payment = await paymentService.getPaystackPaymentDetails(saleId);

  if (!payment) {
   return res.status(404).json({
    success: false,
    message: "Paystack payment not found",
   });
  }

  res.status(200).json({
   success: true,
   data: payment,
  });
 } catch (error) {
  console.error("Get Paystack payment details error:", error);
  res.status(500).json({
   success: false,
   message: error.message || "Failed to get payment details",
  });
 }
};

module.exports = {
 processPayment,
 getPaymentById,
 getPaymentBySaleId,
 getPaymentHistory,
 getPaymentStats,
 // Paystack methods
 initializePaystackPayment,
 verifyPaystackPayment,
 handlePaystackWebhook,
 getPaystackPaymentDetails,
};
