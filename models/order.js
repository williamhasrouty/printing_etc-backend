const mongoose = require("mongoose");
const validator = require("validator");

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "product",
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  productImage: {
    type: String,
    required: false,
  },
  productCategory: {
    type: String,
    required: false,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  selectedOptions: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  customizations: {
    notes: String,
    files: [
      {
        url: String,
        name: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: false, // Optional for guest checkout
  },
  guestInfo: {
    name: String,
    email: {
      type: String,
      validate: {
        validator: (v) => !v || validator.isEmail(v),
        message: "Invalid email format",
      },
    },
    phone: String,
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  discount: {
    code: String,
    amount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  tax: {
    type: Number,
    required: true,
    min: 0,
  },
  shipping: {
    type: Number,
    required: true,
    min: 0,
  },
  deliveryMethod: {
    type: String,
    enum: ["shipping", "pickup"],
    default: "shipping",
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
  shippingAddress: {
    street: {
      type: String,
      required: false,
    },
    city: {
      type: String,
      required: false,
    },
    state: {
      type: String,
      required: false,
    },
    zipCode: {
      type: String,
      required: false,
    },
    country: {
      type: String,
      required: false,
      default: "USA",
    },
  },
  paymentInfo: {
    method: {
      type: String,
      required: true,
      enum: ["card", "paypal"],
      default: "card",
    },
    stripeSessionId: String, // Stripe Checkout Session ID
    stripePaymentIntentId: String,
    transactionId: String,
    status: {
      type: String,
      enum: ["pending", "processing", "succeeded", "failed", "refunded"],
      default: "pending",
    },
  },
  status: {
    type: String,
    required: true,
    enum: [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "completed",
      "cancelled",
    ],
    default: "pending",
  },
  trackingNumber: String,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Generate order number before save
orderSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderNumber = `PE-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model("order", orderSchema);
