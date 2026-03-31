const mongoose = require("mongoose");

const discountCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  description: {
    type: String,
    maxlength: 200,
  },
  type: {
    type: String,
    required: true,
    enum: ["percentage", "fixed"],
  },
  value: {
    type: Number,
    required: true,
    min: 0,
  },
  minOrderAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  maxDiscount: {
    type: Number, // Maximum discount amount (for percentage discounts)
    min: 0,
  },
  usageLimit: {
    type: Number, // Total number of times code can be used
    min: 1,
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  perUserLimit: {
    type: Number, // Times each user can use the code
    default: 1,
    min: 1,
  },
  validFrom: {
    type: Date,
    default: Date.now,
  },
  validUntil: {
    type: Date,
    required: true,
  },
  applicableCategories: [
    {
      type: String,
      enum: [
        "business-cards",
        "flyers",
        "brochures",
        "posters",
        "banners",
        "stationery",
        "invitations",
        "custom-printing",
        "other",
      ],
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
discountCodeSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Check if discount code is valid
discountCodeSchema.methods.isValid = function () {
  const now = new Date();

  // Check if active
  if (!this.isActive) return false;

  // Check date range
  if (now < this.validFrom || now > this.validUntil) return false;

  // Check usage limit
  if (this.usageLimit && this.usageCount >= this.usageLimit) return false;

  return true;
};

// Calculate discount amount
discountCodeSchema.methods.calculateDiscount = function (orderAmount, items) {
  if (!this.isValid()) return 0;

  // Check minimum order amount
  if (orderAmount < this.minOrderAmount) return 0;

  // If specific categories, calculate discount only on applicable items
  if (this.applicableCategories && this.applicableCategories.length > 0) {
    // This would need item details with categories
    // For now, apply to entire order if any item matches
  }

  let discount = 0;

  if (this.type === "percentage") {
    discount = (orderAmount * this.value) / 100;
    // Apply max discount cap if set
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else if (this.type === "fixed") {
    discount = this.value;
    // Don't exceed order amount
    if (discount > orderAmount) {
      discount = orderAmount;
    }
  }

  return Math.round(discount * 100) / 100; // Round to 2 decimals
};

module.exports = mongoose.model("discountCode", discountCodeSchema);
