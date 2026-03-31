const router = require("express").Router();
const {
  createOrder,
  getUserOrders,
  getOrderById,
  getOrderByNumber,
  updateOrderStatus,
  cancelOrder,
  getAllOrders,
} = require("../controllers/orders");
const {
  validateCreateOrder,
  validateOrderId,
  validateUpdateOrderStatus,
} = require("../middlewares/validation");
const auth = require("../middlewares/auth");

// Order creation can be done by authenticated users or guests
// We'll use optional auth middleware for this
const optionalAuth = (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return next(); // No token, continue as guest
  }

  const token = authorization.replace("Bearer ", "");
  const jwt = require("jsonwebtoken");
  const { JWT_SECRET } = require("../config/config");
  const { UnauthorizedError } = require("../errors/errors");

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    next(new UnauthorizedError("Invalid token"));
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

// Admin routes (will add admin middleware later)
router.get("/", getAllOrders); // Get all orders
router.patch(
  "/:orderId/status",
  validateOrderId,
  validateUpdateOrderStatus,
  updateOrderStatus,
);

module.exports = router;
