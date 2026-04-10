const stripe = require("stripe")(require("../config/config").STRIPE_SECRET_KEY);
const Order = require("../models/order");
const User = require("../models/user");
const { BadRequestError, NotFoundError } = require("../errors/errors");
const { NODE_ENV } = require("../config/config");
const { sendPaymentReceipt } = require("../utils/email");

/**
 * SECURE PAYMENT FLOW:
 * 1. Frontend creates order (status: pending)
 * 2. Frontend requests checkout session with orderId
 * 3. Backend creates Stripe Checkout Session
 * 4. User pays via Stripe's hosted UI
 * 5. Stripe webhook confirms payment
 * 6. Backend updates order status (ONLY via webhook)
 *
 * ⚠️ NEVER trust frontend to confirm payment!
 */

// Create Stripe Checkout Session
const createCheckoutSession = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      throw new BadRequestError("Order ID required");
    }

    // Verify order exists and is pending payment
    const order = await Order.findById(orderId).populate("items.product");

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (order.status !== "pending") {
      throw new BadRequestError("Order is not pending payment");
    }

    // Build line items for Stripe from order items
    const lineItems = order.items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.productName,
          description: item.selectedOptions
            ? Object.entries(item.selectedOptions)
                .filter(([_, value]) => value)
                .map(([key, value]) => `${key}: ${value}`)
                .join(", ")
            : undefined,
          images: item.product?.imageUrl ? [item.product.imageUrl] : undefined,
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Add shipping as line item if > 0
    if (order.shipping > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Shipping",
          },
          unit_amount: Math.round(order.shipping * 100),
        },
        quantity: 1,
      });
    }

    // Add tax as line item if > 0
    if (order.tax > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Tax",
          },
          unit_amount: Math.round(order.tax * 100),
        },
        quantity: 1,
      });
    }

    // Success and cancel URLs
    const successUrl =
      NODE_ENV === "production"
        ? `${process.env.FRONTEND_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`
        : `http://localhost:3000/order/success?session_id={CHECKOUT_SESSION_ID}`;

    const cancelUrl =
      NODE_ENV === "production"
        ? `${process.env.FRONTEND_URL}/order/cancel?order_id=${orderId}`
        : `http://localhost:3000/order/cancel?order_id=${orderId}`;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: orderId.toString(),
      metadata: {
        orderId: orderId.toString(),
        orderNumber: order.orderNumber,
      },
      customer_email: order.user
        ? undefined // Will be filled from customer account
        : order.guestInfo?.email,
    });

    // Store session ID in order (for reference only, not for verification!)
    order.paymentInfo.stripeSessionId = session.id;
    await order.save();

    res.status(200).send({
      sessionId: session.id,
      url: session.url, // Redirect user to this URL
    });
  } catch (err) {
    if (
      err.type === "StripeCardError" ||
      err.type === "StripeInvalidRequestError"
    ) {
      next(new BadRequestError(err.message));
    } else {
      next(err);
    }
  }
};

// Get checkout session status (for checking payment completion)
const getCheckoutSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      throw new BadRequestError("Session ID required");
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    res.status(200).send({
      status: session.payment_status,
      customerEmail: session.customer_email,
      amountTotal: session.amount_total / 100,
    });
  } catch (err) {
    if (err.type === "StripeInvalidRequestError") {
      next(new BadRequestError(err.message));
    } else {
      next(err);
    }
  }
};

// Handle Stripe webhook events (CRITICAL - This is where payment is ACTUALLY confirmed)
const handleWebhook = async (req, res, next) => {
  const sig = req.headers["stripe-signature"];
  const { STRIPE_WEBHOOK_SECRET } = require("../config/config");

  let event;

  try {
    // Verify webhook signature (CRITICAL for security)
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("⚠️  Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;

        // ✅ Payment successful - Update order
        if (session.payment_status === "paid") {
          const orderId = session.metadata.orderId;

          const order = await Order.findById(orderId).populate("items.product");
          if (order) {
            order.status = "confirmed";
            order.paymentInfo.status = "succeeded";
            order.paymentInfo.stripePaymentIntentId = session.payment_intent;
            order.paymentInfo.transactionId = session.id;
            order.updatedAt = Date.now();

            await order.save();

            console.log(`✅ Order ${order.orderNumber} marked as PAID`);

            // Get user email
            let userEmail = null;
            if (order.user) {
              const user = await User.findById(order.user);
              userEmail = user?.email;
            } else if (order.guestInfo?.email) {
              userEmail = order.guestInfo.email;
            }

            // Send payment receipt email
            if (userEmail) {
              sendPaymentReceipt(order, userEmail).catch((err) => {
                console.error("Failed to send payment receipt email:", err);
              });
            }
          }
        }
        break;

      case "checkout.session.expired":
        const expiredSession = event.data.object;
        const expiredOrderId = expiredSession.metadata.orderId;

        // Mark order as payment expired/failed
        const expiredOrder = await Order.findById(expiredOrderId);
        if (expiredOrder && expiredOrder.status === "pending") {
          expiredOrder.paymentInfo.status = "failed";
          expiredOrder.notes =
            (expiredOrder.notes || "") + "\nPayment session expired.";
          await expiredOrder.save();

          console.log(
            `⚠️  Payment expired for order ${expiredOrder.orderNumber}`,
          );
        }
        break;

      case "charge.refunded":
        const charge = event.data.object;

        // Find order by payment intent
        const refundedOrder = await Order.findOne({
          "paymentInfo.stripePaymentIntentId": charge.payment_intent,
        });

        if (refundedOrder) {
          refundedOrder.paymentInfo.status = "refunded";
          refundedOrder.status = "cancelled";
          refundedOrder.updatedAt = Date.now();
          await refundedOrder.save();

          console.log(`💰 Order ${refundedOrder.orderNumber} refunded`);

          // TODO: Send refund confirmation email
        }
        break;

      default:
        console.log(`ℹ️  Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Error processing webhook:", err);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};

// Create refund (admin only)
const createRefund = async (req, res, next) => {
  try {
    const { orderId, amount, reason = "requested_by_customer" } = req.body;

    if (!orderId) {
      throw new BadRequestError("Order ID required");
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (!order.paymentInfo.stripePaymentIntentId) {
      throw new BadRequestError("No payment found for this order");
    }

    if (order.paymentInfo.status === "refunded") {
      throw new BadRequestError("Order already refunded");
    }

    const refundData = {
      payment_intent: order.paymentInfo.stripePaymentIntentId,
      reason,
    };

    // If partial refund, specify amount
    if (amount) {
      refundData.amount = Math.round(amount * 100);
    }

    const refund = await stripe.refunds.create(refundData);

    // Update order (webhook will also update, but we do it here for immediate response)
    order.paymentInfo.status = "refunded";
    order.status = "cancelled";
    order.updatedAt = Date.now();
    await order.save();

    res.status(200).send({
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status,
      order: order,
    });
  } catch (err) {
    if (err.type === "StripeInvalidRequestError") {
      next(new BadRequestError(err.message));
    } else {
      next(err);
    }
  }
};

module.exports = {
  createCheckoutSession,
  getCheckoutSession,
  handleWebhook,
  createRefund,
};
