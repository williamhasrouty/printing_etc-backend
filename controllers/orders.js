const Order = require("../models/order");
const Product = require("../models/product");
const DiscountCode = require("../models/discountCode");
const User = require("../models/user");
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} = require("../errors/errors");
const {
  calculateItemPrice,
  calculateOrderTotal,
  calculateShipping,
  getTaxRate,
} = require("../utils/pricing");
const { sendOrderConfirmation, sendStatusUpdate } = require("../utils/email");

// Create a new order (with BACKEND price validation and recalculation)
const createOrder = async (req, res, next) => {
  try {
    const {
      guestInfo,
      customerInfo,
      items,
      discount,
      shippingAddress,
      billingInfo,
      deliveryMethod,
      notes,
    } = req.body;

    // Validate items exist
    if (!items || items.length === 0) {
      throw new BadRequestError("Order must contain at least one item");
    }

    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // SECURITY: Validate ALL product IDs and fetch actual products from database
    const productIds = items.map((item) => item.productId || item.product);
    const products = await Product.find({ _id: { $in: productIds } });

    if (products.length !== productIds.length) {
      throw new BadRequestError("One or more invalid product IDs");
    }

    // Create a map for quick product lookup
    const productMap = {};
    products.forEach((p) => {
      productMap[p._id.toString()] = p;
    });

    // SECURITY: Recalculate prices for each item using BACKEND logic
    const validatedItems = items.map((item) => {
      const productId = (item.productId || item.product).toString();
      const product = productMap[productId];

      if (!product) {
        throw new BadRequestError(`Product not found: ${productId}`);
      }

      // Validate quantity
      const quantity = parseInt(item.quantity, 10);
      if (!quantity || quantity < 1) {
        throw new BadRequestError("Invalid quantity");
      }

      // RECALCULATE price using backend logic (NEVER trust frontend!)
      const { price, totalPrice } = calculateItemPrice(
        product,
        item.selectedOptions || item.options || {},
        quantity,
      );

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
        product: product._id,
        productName: product.name,
        productImage: product.imageUrl,
        productCategory: product.category,
        quantity,
        selectedOptions: item.selectedOptions || item.options || {},
        customizations,
        price, // ✅ Backend-calculated price
        totalPrice, // ✅ Backend-calculated total
      };
    });

    // SECURITY: Validate discount code if provided
    let discountAmount = 0;
    let discountCode = null;

    if (discount && discount.code) {
      const code = await DiscountCode.findOne({
        code: discount.code.toUpperCase(),
      });

      if (!code) {
        throw new BadRequestError("Invalid discount code");
      }

      if (!code.isValid()) {
        throw new BadRequestError("Discount code is not valid or has expired");
      }

      // Calculate subtotal first to check minimum order amount
      const itemsSubtotal = validatedItems.reduce(
        (sum, item) => sum + item.totalPrice,
        0,
      );

      if (itemsSubtotal < code.minOrderAmount) {
        throw new BadRequestError(
          `Minimum order amount of $${code.minOrderAmount} required for this discount`,
        );
      }

      // Calculate discount using backend logic
      discountAmount = code.calculateDiscount(itemsSubtotal, validatedItems);
      discountCode = code.code;

      // Increment usage count
      code.usageCount += 1;
      await code.save();
    }

    // SECURITY: Recalculate shipping address
    const validatedShippingAddress = {
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
    };

    // SECURITY: Recalculate shipping cost using backend logic
    const shippingCost = calculateShipping(
      validatedItems,
      validatedShippingAddress,
    );

    // SECURITY: Recalculate tax rate based on shipping address
    const taxRate = getTaxRate(validatedShippingAddress);

    // SECURITY: Recalculate ALL totals using backend logic
    const calculatedTotals = calculateOrderTotal(validatedItems, {
      shippingCost,
      taxRate,
      discountAmount,
    });

    // Log if frontend values differ from backend calculations (for debugging)
    const frontendTotal = req.body.total;
    if (
      frontendTotal &&
      Math.abs(frontendTotal - calculatedTotals.total) > 0.02
    ) {
      console.warn(
        `⚠️  Price mismatch detected! Frontend: $${frontendTotal}, Backend: $${calculatedTotals.total}`,
      );
      console.warn(`Order: ${orderNumber}`);
    }

    // Create order data with BACKEND-calculated values
    const orderData = {
      orderNumber,
      items: validatedItems,
      subtotal: calculatedTotals.subtotal,
      discount: {
        code: discountCode,
        amount: calculatedTotals.discount,
      },
      tax: calculatedTotals.tax,
      shipping: calculatedTotals.shipping,
      deliveryMethod: deliveryMethod || "shipping",
      total: calculatedTotals.total, // ✅ Backend-calculated total
      shippingAddress: validatedShippingAddress,
      notes: notes || "",
      // ⚠️ SECURITY: Order starts as "pending" - ONLY webhook can mark as paid
      status: "pending",
      paymentInfo: {
        method: "card",
        status: "pending",
      },
    };

    // If user is authenticated, use their ID
    if (req.user) {
      orderData.user = req.user._id;
    } else if (guestInfo || customerInfo) {
      // Guest checkout
      orderData.guestInfo = guestInfo || customerInfo;
    } else {
      throw new BadRequestError("User information or guest info required");
    }

    // Create order
    const order = await Order.create(orderData);
    const populatedOrder = await Order.findById(order._id)
      .populate("items.product")
      .populate("user", "name email phone");

    // Get user email for confirmation
    let userEmail = null;
    if (populatedOrder.user) {
      userEmail = populatedOrder.user.email;
    } else if (populatedOrder.guestInfo?.email) {
      userEmail = populatedOrder.guestInfo.email;
    }

    // Send order confirmation email
    if (userEmail) {
      sendOrderConfirmation(populatedOrder, userEmail).catch((err) => {
        console.error("Failed to send order confirmation email:", err);
      });
    }

    res.status(201).send(populatedOrder);
  } catch (err) {
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      next(new BadRequestError(`Invalid order data: ${errors.join(", ")}`));
    } else if (err.name === "CastError") {
      next(new BadRequestError("Invalid product ID format"));
    } else {
      next(err);
    }
  }
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
const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status, trackingNumber } = req.body;

    // Get the order before updating to track previous status
    const previousOrder =
      await Order.findById(orderId).populate("items.product");

    if (!previousOrder) {
      throw new NotFoundError("Order not found");
    }

    const previousStatus = previousOrder.status;

    const updateData = {
      status,
      updatedAt: Date.now(),
    };

    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }

    const order = await Order.findByIdAndUpdate(orderId, updateData, {
      new: true,
      runValidators: true,
    }).populate("items.product");

    // Get user email for status update notification
    let userEmail = null;
    if (order.user) {
      const user = await User.findById(order.user);
      userEmail = user?.email;
    } else if (order.guestInfo?.email) {
      userEmail = order.guestInfo.email;
    }

    // Send status update email if status actually changed
    if (userEmail && status !== previousStatus) {
      sendStatusUpdate(order, userEmail, previousStatus).catch((err) => {
        console.error("Failed to send status update email:", err);
      });
    }

    res.send(order);
  } catch (err) {
    next(err);
  }
};

// Cancel order (user can cancel their own pending/confirmed orders)
const cancelOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).populate("items.product");

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

    const previousStatus = order.status;
    order.status = "cancelled";
    order.updatedAt = Date.now();

    await order.save();

    // Get user email for cancellation notification
    let userEmail = null;
    if (order.user) {
      const user = await User.findById(order.user);
      userEmail = user?.email;
    } else if (order.guestInfo?.email) {
      userEmail = order.guestInfo.email;
    }

    // Send cancellation notification
    if (userEmail) {
      sendStatusUpdate(order, userEmail, previousStatus).catch((err) => {
        console.error("Failed to send cancellation email:", err);
      });
    }

    res.send(order);
  } catch (err) {
    next(err);
  }
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
