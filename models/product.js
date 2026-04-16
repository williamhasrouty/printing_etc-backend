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
    required: false,
    enum: [
      "business-cards",
      "flyers",
      "brochures",
      "posters",
      "banners",
      "stickers",
      "postcards",
      "booklets",
      "door-hangers",
      "decals",
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
    quantities: [
      {
        name: String,
        priceModifier: {
          type: Number,
          default: 0,
        },
      },
    ],
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
    orientations: [
      {
        name: String,
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
    roundedCorners: [
      {
        name: String,
        priceModifier: {
          type: Number,
          default: 0,
        },
      },
    ],
    coatings: [
      {
        name: String,
        priceModifier: {
          type: Number,
          default: 0,
        },
      },
    ],
    raisedPrint: [
      {
        name: String,
        priceModifier: {
          type: Number,
          default: 0,
        },
      },
    ],
    customOptions: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  pricing: [
    {
      quantity: String,
      size: String,
      paperType: String,
      orientation: String,
      color: String,
      coating: String,
      finish: String,
      roundedCorner: String,
      raisedPrint: String,
      price: {
        type: Number,
        required: true,
        min: 0,
      },
    },
  ],
  inStock: {
    type: Boolean,
    default: true,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  position: {
    type: Number,
    default: 0,
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
