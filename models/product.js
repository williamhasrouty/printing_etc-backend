const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 100,
  },
  description: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 1000,
  },
  category: {
    type: String,
    required: true,
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
  basePrice: {
    type: Number,
    required: true,
    min: 0,
  },
  imageUrl: {
    type: String,
    required: true,
    validate: {
      validator: (v) => /^https?:\/\/.+/.test(v),
      message: "Invalid image URL",
    },
  },
  images: [
    {
      type: String,
      validate: {
        validator: (v) => /^https?:\/\/.+/.test(v),
        message: "Invalid image URL",
      },
    },
  ],
  options: {
    sizes: [
      {
        name: String,
        dimensions: String,
        priceModifier: {
          type: Number,
          default: 0,
        },
      },
    ],
    paperTypes: [
      {
        name: String,
        priceModifier: {
          type: Number,
          default: 0,
        },
      },
    ],
    finishes: [
      {
        name: String,
        priceModifier: {
          type: Number,
          default: 0,
        },
      },
    ],
    colors: [
      {
        name: String,
        priceModifier: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  inStock: {
    type: Boolean,
    default: true,
  },
  featured: {
    type: Boolean,
    default: false,
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
productSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("product", productSchema);
