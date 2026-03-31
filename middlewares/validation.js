const { Joi, celebrate } = require("celebrate");

// Validation for user signup
const validateSignup = celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8),
    name: Joi.string().required().min(2).max(50),
    phone: Joi.string(),
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
    name: Joi.string().min(2).max(50),
    phone: Joi.string(),
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
        "stationery",
        "invitations",
        "custom-printing",
        "other",
      ),
    basePrice: Joi.number().required().min(0),
    imageUrl: Joi.string().required().uri(),
    images: Joi.array().items(Joi.string().uri()),
    options: Joi.object().keys({
      sizes: Joi.array().items(
        Joi.object().keys({
          name: Joi.string(),
          dimensions: Joi.string(),
          priceModifier: Joi.number().default(0),
        }),
      ),
      paperTypes: Joi.array().items(
        Joi.object().keys({
          name: Joi.string(),
          priceModifier: Joi.number().default(0),
        }),
      ),
      finishes: Joi.array().items(
        Joi.object().keys({
          name: Joi.string(),
          priceModifier: Joi.number().default(0),
        }),
      ),
      colors: Joi.array().items(
        Joi.object().keys({
          name: Joi.string(),
          priceModifier: Joi.number().default(0),
        }),
      ),
    }),
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
      "stationery",
      "invitations",
      "custom-printing",
      "other",
    ),
    basePrice: Joi.number().min(0),
    imageUrl: Joi.string().uri(),
    images: Joi.array().items(Joi.string().uri()),
    options: Joi.object().keys({
      sizes: Joi.array().items(
        Joi.object().keys({
          name: Joi.string(),
          dimensions: Joi.string(),
          priceModifier: Joi.number().default(0),
        }),
      ),
      paperTypes: Joi.array().items(
        Joi.object().keys({
          name: Joi.string(),
          priceModifier: Joi.number().default(0),
        }),
      ),
      finishes: Joi.array().items(
        Joi.object().keys({
          name: Joi.string(),
          priceModifier: Joi.number().default(0),
        }),
      ),
      colors: Joi.array().items(
        Joi.object().keys({
          name: Joi.string(),
          priceModifier: Joi.number().default(0),
        }),
      ),
    }),
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
  body: Joi.object().keys({
    guestInfo: Joi.object().keys({
      name: Joi.string().required().min(2).max(50),
      email: Joi.string().required().email(),
      phone: Joi.string(),
    }),
    items: Joi.array()
      .required()
      .min(1)
      .items(
        Joi.object().keys({
          product: Joi.string().required().hex().length(24),
          productName: Joi.string().required(),
          quantity: Joi.number().required().min(1),
          selectedOptions: Joi.object().keys({
            size: Joi.string(),
            paperType: Joi.string(),
            finish: Joi.string(),
            color: Joi.string(),
          }),
          customizations: Joi.object().keys({
            notes: Joi.string(),
            files: Joi.array().items(
              Joi.object().keys({
                url: Joi.string().uri(),
                name: Joi.string(),
              }),
            ),
          }),
          price: Joi.number().required().min(0),
          totalPrice: Joi.number().required().min(0),
        }),
      ),
    subtotal: Joi.number().required().min(0),
    tax: Joi.number().required().min(0),
    shipping: Joi.number().required().min(0),
    total: Joi.number().required().min(0),
    shippingAddress: Joi.object()
      .required()
      .keys({
        street: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        zipCode: Joi.string().required(),
        country: Joi.string().default("USA"),
      }),
    paymentInfo: Joi.object()
      .required()
      .keys({
        method: Joi.string().valid("card", "paypal").default("card"),
        stripePaymentIntentId: Joi.string(),
        transactionId: Joi.string(),
        status: Joi.string()
          .valid("pending", "processing", "succeeded", "failed", "refunded")
          .default("pending"),
      }),
    notes: Joi.string(),
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
        "cancelled",
      ),
    trackingNumber: Joi.string(),
  }),
});

module.exports = {
  validateSignup,
  validateSignin,
  validateUpdateUser,
  validateProductId,
  validateCreateProduct,
  validateUpdateProduct,
  validateOrderId,
  validateCreateOrder,
  validateUpdateOrderStatus,
};
