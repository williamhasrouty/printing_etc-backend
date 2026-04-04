const router = require("express").Router();
const {
  createOrder,
  getUserOrders,
  getOrderById,
  getOrderByNumber,
  updateOrderStatus,
  cancelOrder,
  getAllOrders,
  getOrderAnalytics,
  reorder,
} = require("../controllers/orders");
const {
  validateCreateOrder,
  validateOrderId,
  validateUpdateOrderStatus,
} = require("../middlewares/validation");
const auth = require("../middlewares/auth");
const requireAdmin = require("../middlewares/admin");

// Order creation can be done by authenticated users or guests
// We'll use optional auth middleware for this
const optionalAuth = (req, res, next) => {
  const { authorization } = req.headers;

  // Check if no authorization or if token is "null" or "undefined" string
  if (
    !authorization ||
    !authorization.startsWith("Bearer ") ||
    authorization === "Bearer null" ||
    authorization === "Bearer undefined"
  ) {
    return next(); // No token, continue as guest
  }

  const token = authorization.replace("Bearer ", "");

  // Additional check for "null" or "undefined" after extraction
  if (!token || token === "null" || token === "undefined") {
    return next(); // Continue as guest
  }

  const jwt = require("jsonwebtoken");
  const { JWT_SECRET } = require("../config/config");

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    // Token is invalid or expired - continue as guest
    next();
  }
};

// Create order (authenticated or guest)
router.post("/", optionalAuth, validateCreateOrder, createOrder);

// Get order by order number (for guest lookup)
router.get("/number/:orderNumber", getOrderByNumber);

// Authenticated user routes
router.get("/me", auth, getUserOrders);

// Get single order by ID (with permission check)
router.get("/:orderId", optionalAuth, validateOrderId, getOrderById);

// Cancel order
router.patch("/:orderId/cancel", auth, validateOrderId, cancelOrder);

// Reorder - get items from previous order
router.get("/:orderId/reorder", auth, validateOrderId, reorder);

// Admin routes
router.get("/", auth, requireAdmin, getAllOrders); // Get all orders
router.get("/analytics/stats", auth, requireAdmin, getOrderAnalytics); // Order analytics
router.patch(
  "/:orderId/status",
  auth,
  requireAdmin,
  validateOrderId,
  validateUpdateOrderStatus,
  updateOrderStatus,
);

module.exports = router;
