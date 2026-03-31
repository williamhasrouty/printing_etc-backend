const router = require("express").Router();
const express = require("express");
const {
  createCheckoutSession,
  getCheckoutSession,
  handleWebhook,
  createRefund,
} = require("../controllers/payment");
const auth = require("../middlewares/auth");
const requireAdmin = require("../middlewares/admin");

/**
 * SECURE PAYMENT ROUTES
 *
 * Flow:
 * 1. POST /orders           - Create order (status: pending)
 * 2. POST /payment/checkout - Create Stripe session
 * 3. User pays via Stripe hosted checkout page
 * 4. POST /payment/webhook  - Stripe confirms payment (marks order as paid)
 * 5. GET /payment/session/:sessionId - Check payment status
 */

// Create Stripe Checkout Session (for an existing pending order)
router.post("/checkout", createCheckoutSession);

// Get checkout session status (to verify payment completion)
router.get("/session/:sessionId", getCheckoutSession);

// Stripe webhook (CRITICAL - This is where payment is actually confirmed)
// Must use raw body for signature verification
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook,
);

// Create refund (admin only)
router.post("/refund", auth, requireAdmin, createRefund);

module.exports = router;
