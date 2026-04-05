const Order = require("../models/order");
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} = require("../errors/errors");

// Create a new order
const createOrder = (req, res, next) => {
  const {
    guestInfo,
    customerInfo,
    items,
    subtotal,
    discount,
    tax,
    shipping,
    total,
    shippingAddress,
    billingInfo,
    deliveryMethod,
    notes,
  } = req.body;

  // Generate unique order number
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Transform items to include all required fields and product details
  const transformedItems = items.map((item) => {
    // Build customizations with files
    const customizations = item.customizations || {};
    const files = [];

    // Add front/main file if exists
    if (item.uploadedFile && item.uploadedFile.cloudinaryUrl) {
      files.push({
        url: item.uploadedFile.cloudinaryUrl,
        name: item.uploadedFile.fileName || "Front Design",
        uploadedAt: new Date(),
      });
    }

    // Add back file if exists
    if (item.uploadedBackFile && item.uploadedBackFile.cloudinaryUrl) {
      files.push({
        url: item.uploadedBackFile.cloudinaryUrl,
        name: item.uploadedBackFile.fileName || "Back Design",
        uploadedAt: new Date(),
      });
    }

    // Merge files into customizations
    if (files.length > 0) {
      customizations.files = files;
    }

    return {
      product: item.productId || item.product,
      productName: item.name || item.productName,
      productImage: item.imageUrl || item.productImage,
      productCategory: item.category || item.productCategory,
      quantity: item.quantity,
      selectedOptions: item.selectedOptions || item.options || {},
      customizations: customizations,
      price: item.price || item.basePrice || 0,
      totalPrice:
        item.totalPrice || item.quantity * (item.price || item.basePrice || 0),
    };
  });

  // Check if user is authenticated or guest checkout
  const orderData = {
    orderNumber,
    items: transformedItems,
    subtotal: subtotal || 0,
    discount: discount || { code: null, amount: 0 },
    tax: tax || 0,
    shipping: shipping || 0,
    deliveryMethod: deliveryMethod || "shipping",
    total,
    shippingAddress: {
      street:
        shippingAddress?.street ||
        billingInfo?.shippingAddress ||
        billingInfo?.billingAddress ||
        "",
      city:
        shippingAddress?.city ||
        billingInfo?.shippingCity ||
        billingInfo?.city ||
        "",
      state:
        shippingAddress?.state ||
        billingInfo?.shippingState ||
        billingInfo?.state ||
        "",
      zipCode:
        shippingAddress?.zipCode ||
        billingInfo?.shippingZipCode ||
        billingInfo?.zipCode ||
        "",
      country: shippingAddress?.country || billingInfo?.country || "USA",
    },
    notes: notes || "",
    // ⚠️ SECURITY: Order starts as "pending" - ONLY webhook can mark as paid
    status: "pending",
    paymentInfo: {
      method: "card", // Default to card payment
      status: "pending", // Always starts as pending
    },
  };

  // If user is authenticated, use their ID
  if (req.user) {
    orderData.user = req.user._id;
  } else if (guestInfo || customerInfo) {
    // Guest checkout - accept either guestInfo or customerInfo
    orderData.guestInfo = guestInfo || customerInfo;
  } else {
    return next(new BadRequestError("User information or guest info required"));
  }

  Order.create(orderData)
    .then((order) => {
      return Order.findById(order._id).populate("items.product");
    })
    .then((order) => {
      // Return order with ID so frontend can create checkout session
      res.status(201).send(order);
    })
    .catch((err) => {
      if (err.name === "ValidationError") {
        // Extract validation error details
        const errors = Object.values(err.errors).map((e) => e.message);
        next(new BadRequestError(`Invalid order data: ${errors.join(", ")}`));
      } else {
        next(err);
      }
    });
};

// Get all orders for current user
const getUserOrders = (req, res, next) => {
  Order.find({ user: req.user._id })
    .populate("items.product")
    .sort({ createdAt: -1 })
    .then((orders) => res.send(orders))
    .catch(next);
};

// Get a single order by ID
const getOrderById = (req, res, next) => {
  const { orderId } = req.params;

  Order.findById(orderId)
    .populate("items.product")
    .then((order) => {
      if (!order) {
        throw new NotFoundError("Order not found");
      }

      // Check if user has permission to view this order
      if (req.user) {
        // Authenticated user - check if order belongs to them
        if (order.user && order.user.toString() !== req.user._id) {
          throw new ForbiddenError("Access denied");
        }
      }
      // For guest orders, we'll add email verification later

      res.send(order);
    })
    .catch((err) => {
      if (err.name === "CastError") {
        next(new BadRequestError("Invalid order ID"));
      } else {
        next(err);
      }
    });
};

// Get order by order number (for guest lookup)
const getOrderByNumber = (req, res, next) => {
  const { orderNumber } = req.params;
  const { email } = req.query;

  Order.findOne({ orderNumber })
    .populate("items.product")
    .then((order) => {
      if (!order) {
        throw new NotFoundError("Order not found");
      }

      // Verify email for guest orders
      if (!order.user && order.guestInfo) {
        if (!email || order.guestInfo.email !== email) {
          throw new ForbiddenError("Invalid email for order verification");
        }
      }

      res.send(order);
    })
    .catch(next);
};

// Update order status (admin only - will add admin middleware later)
const updateOrderStatus = (req, res, next) => {
  const { orderId } = req.params;
  const { status, trackingNumber } = req.body;

  const updateData = {
    status,
    updatedAt: Date.now(),
  };

  if (trackingNumber) {
    updateData.trackingNumber = trackingNumber;
  }

  Order.findByIdAndUpdate(orderId, updateData, {
    new: true,
    runValidators: true,
  })
    .populate("items.product")
    .then((order) => {
      if (!order) {
        throw new NotFoundError("Order not found");
      }
      res.send(order);
    })
    .catch((err) => {
      if (err.name === "CastError") {
        next(new BadRequestError("Invalid order ID"));
      } else if (err.name === "ValidationError") {
        next(new BadRequestError("Invalid data provided"));
      } else {
        next(err);
      }
    });
};

// Cancel an order
const cancelOrder = (req, res, next) => {
  const { orderId } = req.params;

  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        throw new NotFoundError("Order not found");
      }

      // Check permission
      if (req.user && order.user && order.user.toString() !== req.user._id) {
        throw new ForbiddenError("Access denied");
      }

      // Only allow cancellation if order is pending or confirmed
      if (!["pending", "confirmed"].includes(order.status)) {
        throw new BadRequestError("Order cannot be cancelled at this stage");
      }

      order.status = "cancelled";
      order.updatedAt = Date.now();
      return order.save();
    })
    .then((order) => {
      res.send(order);
    })
    .catch((err) => {
      if (err.name === "CastError") {
        next(new BadRequestError("Invalid order ID"));
      } else {
        next(err);
      }
    });
};

// Get all orders (admin only - will add admin middleware later)
const getAllOrders = (req, res, next) => {
  const { status } = req.query;
  const filter = {};

  if (status) {
    filter.status = status;
  }

  Order.find(filter)
    .populate("items.product")
    .populate("user", "name email phone")
    .sort({ createdAt: -1 })
    .then((orders) => res.send(orders))
    .catch(next);
};

// Get order analytics (admin only)
const getOrderAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Total orders
    const totalOrders = await Order.countDocuments(filter);

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $match: filter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Revenue statistics
    const revenueStats = await Order.aggregate([
      {
        $match: {
          ...filter,
          status: { $in: ["confirmed", "processing", "shipped", "delivered"] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          averageOrderValue: { $avg: "$total" },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    // Top products
    const topProducts = await Order.aggregate([
      { $match: filter },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          productName: { $first: "$items.productName" },
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.totalPrice" },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
    ]);

    res.send({
      totalOrders,
      ordersByStatus,
      revenue: revenueStats[0] || {
        totalRevenue: 0,
        averageOrderValue: 0,
        totalOrders: 0,
      },
      topProducts,
    });
  } catch (err) {
    next(err);
  }
};

// Reorder - create new order from existing order
const reorder = (req, res, next) => {
  const { orderId } = req.params;

  Order.findById(orderId)
    .populate("items.product")
    .then((order) => {
      if (!order) {
        throw new NotFoundError("Order not found");
      }

      // Check permission
      if (req.user && order.user && order.user.toString() !== req.user._id) {
        throw new ForbiddenError("Access denied");
      }

      // Return order items for frontend to recreate cart
      // Frontend will handle address and payment
      res.send({
        items: order.items.map((item) => ({
          product: item.product._id,
          productName: item.productName,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions,
          customizations: item.customizations,
        })),
        shippingAddress: order.shippingAddress,
      });
    })
    .catch((err) => {
      if (err.name === "CastError") {
        next(new BadRequestError("Invalid order ID"));
      } else {
        next(err);
      }
    });
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  getOrderByNumber,
  updateOrderStatus,
  cancelOrder,
  getAllOrders,
  getOrderAnalytics,
  reorder,
};
