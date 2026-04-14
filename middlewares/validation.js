const { Joi, celebrate } = require("celebrate");

// Validation for user signup
const validateSignup = celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8),
    name: Joi.string().required().min(2).max(50),
    phone: Joi.string().required(),
  }),
});

// Validation for user signin
const validateSignin = celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  }),
});

// Validation for updating user profile
const validateUpdateUser = celebrate({
  body: Joi.object().keys({
    email: Joi.string().email(),
    name: Joi.string().min(2).max(50),
    phone: Joi.string(),
  }),
});

// Validation for updating password
const validateUpdatePassword = celebrate({
  body: Joi.object().keys({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().required().min(8),
  }),
});

// Validation for product ID parameter
const validateProductId = celebrate({
  params: Joi.object().keys({
    productId: Joi.string().required().hex().length(24),
  }),
});

// Validation for creating a product
const validateCreateProduct = celebrate({
  body: Joi.object().keys({
    name: Joi.string().required().min(2).max(100),
    description: Joi.string().required().min(10).max(1000),
    category: Joi.string()
      .required()
      .valid(
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
      ),
    basePrice: Joi.number().required().min(0),
    imageUrl: Joi.string().required().uri(),
    images: Joi.array().items(Joi.string().uri()),
    options: Joi.object()
      .unknown(true)
      .keys({
        quantities: Joi.array().items(
          Joi.object()
            .unknown(true)
            .keys({
              name: Joi.string(),
              priceModifier: Joi.number().default(0),
            }),
        ),
        sizes: Joi.array().items(
          Joi.object()
            .unknown(true)
            .keys({
              name: Joi.string(),
              dimensions: Joi.string(),
              priceModifier: Joi.number().default(0),
            }),
        ),
        orientations: Joi.array().items(
          Joi.object()
            .unknown(true)
            .keys({
              name: Joi.string(),
              priceModifier: Joi.number().default(0),
            }),
        ),
        paperTypes: Joi.array().items(
          Joi.object()
            .unknown(true)
            .keys({
              name: Joi.string(),
              priceModifier: Joi.number().default(0),
            }),
        ),
        finishes: Joi.array().items(
          Joi.object()
            .unknown(true)
            .keys({
              name: Joi.string(),
              priceModifier: Joi.number().default(0),
            }),
        ),
        colors: Joi.array().items(
          Joi.object()
            .unknown(true)
            .keys({
              name: Joi.string(),
              priceModifier: Joi.number().default(0),
            }),
        ),
        roundedCorners: Joi.array().items(
          Joi.object()
            .unknown(true)
            .keys({
              name: Joi.string(),
              priceModifier: Joi.number().default(0),
            }),
        ),
        coatings: Joi.array().items(
          Joi.object()
            .unknown(true)
            .keys({
              name: Joi.string(),
              priceModifier: Joi.number().default(0),
            }),
        ),
        raisedPrint: Joi.array().items(
          Joi.object()
            .unknown(true)
            .keys({
              name: Joi.string(),
              priceModifier: Joi.number().default(0),
            }),
        ),
        customOptions: Joi.object().unknown(true),
      }),
    pricing: Joi.array().items(
      Joi.object()
        .unknown(true)
        .keys({
          quantity: Joi.string().allow(""),
          size: Joi.string().allow(""),
          paperType: Joi.string().allow(""),
          orientation: Joi.string().allow(""),
          color: Joi.string().allow(""),
          coating: Joi.string().allow(""),
          finish: Joi.string().allow(""),
          roundedCorner: Joi.string().allow(""),
          raisedPrint: Joi.string().allow(""),
          price: Joi.number().required().min(0),
        }),
    ),
    position: Joi.number().integer().min(0),
    inStock: Joi.boolean(),
    featured: Joi.boolean(),
  }),
});

// Validation for updating a product
const validateUpdateProduct = celebrate({
  body: Joi.object().keys({
    name: Joi.string().min(2).max(100),
    description: Joi.string().min(10).max(1000),
    category: Joi.string().valid(
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
    ),
    basePrice: Joi.number().min(0),
    imageUrl: Joi.string().uri(),
    images: Joi.array().items(Joi.string().uri()),
    options: Joi.object()
      .unknown(true)
      .keys({
        quantities: Joi.array().items(
          Joi.object()
            .unknown(true)
            .keys({
              name: Joi.string(),
              priceModifier: Joi.number().default(0),
            }),
        ),
        sizes: Joi.array().items(
          Joi.object()
            .unknown(true)
            .keys({
              name: Joi.string(),
              dimensions: Joi.string(),
              priceModifier: Joi.number().default(0),
            }),
        ),
        orientations: Joi.array().items(
          Joi.object()
            .unknown(true)
            .keys({
              name: Joi.string(),
              priceModifier: Joi.number().default(0),
            }),
        ),
        paperTypes: Joi.array().items(
          Joi.object()
            .unknown(true)
            .keys({
              name: Joi.string(),
              priceModifier: Joi.number().default(0),
            }),
        ),
        finishes: Joi.array().items(
          Joi.object()
            .unknown(true)
            .keys({
              name: Joi.string(),
              priceModifier: Joi.number().default(0),
            }),
        ),
        colors: Joi.array().items(
          Joi.object()
            .unknown(true)
            .keys({
              name: Joi.string(),
              priceModifier: Joi.number().default(0),
            }),
        ),
        roundedCorners: Joi.array().items(
          Joi.object()
            .unknown(true)
            .keys({
              name: Joi.string(),
              priceModifier: Joi.number().default(0),
            }),
        ),
        coatings: Joi.array().items(
          Joi.object()
            .unknown(true)
            .keys({
              name: Joi.string(),
              priceModifier: Joi.number().default(0),
            }),
        ),
        raisedPrint: Joi.array().items(
          Joi.object()
            .unknown(true)
            .keys({
              name: Joi.string(),
              priceModifier: Joi.number().default(0),
            }),
        ),
        customOptions: Joi.object().unknown(true),
      }),
    pricing: Joi.array().items(
      Joi.object()
        .unknown(true)
        .keys({
          quantity: Joi.string().allow(""),
          size: Joi.string().allow(""),
          paperType: Joi.string().allow(""),
          orientation: Joi.string().allow(""),
          color: Joi.string().allow(""),
          coating: Joi.string().allow(""),
          finish: Joi.string().allow(""),
          roundedCorner: Joi.string().allow(""),
          raisedPrint: Joi.string().allow(""),
          price: Joi.number().required().min(0),
        }),
    ),
    position: Joi.number().integer().min(0),
    inStock: Joi.boolean(),
    featured: Joi.boolean(),
  }),
});

// Validation for order ID parameter
const validateOrderId = celebrate({
  params: Joi.object().keys({
    orderId: Joi.string().required().hex().length(24),
  }),
});

// Validation for creating an order
const validateCreateOrder = celebrate({
  body: Joi.object()
    .unknown(true)
    .keys({
      items: Joi.array().required().min(1),
      total: Joi.number().required().min(0),
    }),
});

// Validation for updating order status
const validateUpdateOrderStatus = celebrate({
  body: Joi.object().keys({
    status: Joi.string()
      .required()
      .valid(
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "completed",
        "cancelled",
      ),
    trackingNumber: Joi.string(),
  }),
});

// Validation for address
const validateAddress = celebrate({
  body: Joi.object().keys({
    label: Joi.string(),
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    country: Joi.string().default("USA"),
    isDefault: Joi.boolean(),
  }),
});

// Validation for address ID parameter
const validateAddressId = celebrate({
  params: Joi.object().keys({
    addressId: Joi.string().required().hex().length(24),
  }),
});

module.exports = {
  validateSignup,
  validateSignin,
  validateUpdateUser,
  validateUpdatePassword,
  validateProductId,
  validateCreateProduct,
  validateUpdateProduct,
  validateOrderId,
  validateCreateOrder,
  validateUpdateOrderStatus,
  validateAddress,
  validateAddressId,
};
