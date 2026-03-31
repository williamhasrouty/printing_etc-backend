const router = require("express").Router();
const express = require("express");
const {
  createPaymentIntent,
  confirmPayment,
  handleWebhook,
  createRefund,
} = require("../controllers/payment");

// Create payment intent
router.post("/create-payment-intent", createPaymentIntent);

// Confirm payment
router.post("/confirm-payment", confirmPayment);

// Stripe webhook (raw body needed for signature verification)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook,
);

// Create refund (admin only - will add admin middleware later)
router.post("/refund", createRefund);

module.exports = router;
