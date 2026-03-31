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
    items,
    subtotal,
    tax,
    shipping,
    total,
    shippingAddress,
    paymentInfo,
    notes,
  } = req.body;

  // Check if user is authenticated or guest checkout
  const orderData = {
    items,
    subtotal,
    tax,
    shipping,
    total,
    shippingAddress,
    paymentInfo,
    notes,
  };

  // If user is authenticated, use their ID
  if (req.user) {
    orderData.user = req.user._id;
  } else if (guestInfo) {
    // Guest checkout
    orderData.guestInfo = guestInfo;
  } else {
    return next(new BadRequestError("User information or guest info required"));
  }

  Order.create(orderData)
    .then((order) => {
      return Order.findById(order._id).populate("items.product");
    })
    .then((order) => {
      res.status(201).send(order);
    })
    .catch((err) => {
      if (err.name === "ValidationError") {
        next(new BadRequestError("Invalid order data provided"));
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
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .then((orders) => res.send(orders))
    .catch(next);
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  getOrderByNumber,
  updateOrderStatus,
  cancelOrder,
  getAllOrders,
};
