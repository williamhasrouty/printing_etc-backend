const stripe = require("stripe")(require("../config/config").STRIPE_SECRET_KEY);
const { BadRequestError } = require("../errors/errors");

// Create payment intent
const createPaymentIntent = async (req, res, next) => {
  try {
    const { amount, currency = "usd", metadata = {} } = req.body;

    if (!amount || amount <= 0) {
      throw new BadRequestError("Invalid amount");
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata,
    });

    res.status(200).send({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
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

// Confirm payment
const confirmPayment = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      throw new BadRequestError("Payment intent ID required");
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.status(200).send({
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
    });
  } catch (err) {
    if (err.type === "StripeInvalidRequestError") {
      next(new BadRequestError(err.message));
    } else {
      next(err);
    }
  }
};

// Handle webhook events
const handleWebhook = async (req, res, next) => {
  const sig = req.headers["stripe-signature"];
  const { STRIPE_WEBHOOK_SECRET } = require("../config/config");

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      console.log("PaymentIntent was successful:", paymentIntent.id);
      // Update order status here
      break;
    case "payment_intent.payment_failed":
      const failedPayment = event.data.object;
      console.log("PaymentIntent failed:", failedPayment.id);
      // Handle failed payment
      break;
    case "charge.refunded":
      const refund = event.data.object;
      console.log("Charge was refunded:", refund.id);
      // Handle refund
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

// Create refund
const createRefund = async (req, res, next) => {
  try {
    const {
      paymentIntentId,
      amount,
      reason = "requested_by_customer",
    } = req.body;

    if (!paymentIntentId) {
      throw new BadRequestError("Payment intent ID required");
    }

    const refundData = {
      payment_intent: paymentIntentId,
      reason,
    };

    // If partial refund, specify amount
    if (amount) {
      refundData.amount = Math.round(amount * 100);
    }

    const refund = await stripe.refunds.create(refundData);

    res.status(200).send({
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status,
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
  createPaymentIntent,
  confirmPayment,
  handleWebhook,
  createRefund,
};
