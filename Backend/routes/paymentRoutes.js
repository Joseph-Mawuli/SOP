// routes/paymentRoutes.js
// Payment Processing API Routes

const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { verifyToken, requireRole } = require("../middleware/auth");

// ==================== PAYSTACK ROUTES ====================
// ✅ FIX: Paystack routes MUST come before /:id wildcard routes.
// Express matches routes top-to-bottom. If /:id is defined first,
// GET /paystack/verify/abc → Express reads id = "paystack" and
// never reaches the actual Paystack handlers below. Always put
// specific paths before wildcard/param routes.

// Webhook — no auth (Paystack calls this directly from their servers)
// ✅ Verify the webhook signature inside the controller using your Paystack secret
router.post("/paystack/webhook", paymentController.handlePaystackWebhook);

// Initialize Paystack payment
// ✅ Added verifyToken so only your app's users can trigger payment initialization.
// Remove it if you have a legitimate guest-checkout use case.
router.post(
 "/paystack/initialize",
 verifyToken,
 requireRole("cashier", "administrator"),
 paymentController.initializePaystackPayment,
);

// Verify Paystack payment after redirect
router.get("/paystack/verify/:reference", verifyToken, paymentController.verifyPaystackPayment);

// Get Paystack payment details by sale ID
router.get("/paystack/details/:saleId", verifyToken, paymentController.getPaystackPaymentDetails);

// ==================== GENERAL PAYMENT ROUTES ====================
// These must come AFTER all specific named routes above.

router.post("/", verifyToken, requireRole("cashier", "administrator", "manager"), paymentController.processPayment);

router.get("/history", verifyToken, paymentController.getPaymentHistory);

router.get("/stats", verifyToken, requireRole("administrator", "manager"), paymentController.getPaymentStats);

router.get("/sale/:saleId", verifyToken, paymentController.getPaymentBySaleId);

// ✅ /:id wildcard stays LAST — it will now never accidentally catch /paystack/* paths
router.get("/:id", verifyToken, paymentController.getPaymentById);

module.exports = router;
