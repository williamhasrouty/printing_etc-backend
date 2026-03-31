const router = require("express").Router();
const { createUser, login } = require("../controllers/users");
const { validateSignup, validateSignin } = require("../middlewares/validation");
const auth = require("../middlewares/auth");
const usersRouter = require("./users");
const productsRouter = require("./products");
const ordersRouter = require("./orders");
const uploadRouter = require("./upload");
const paymentRouter = require("./payment");

// Public routes (no authentication required)
router.post("/signup", validateSignup, createUser);
router.post("/signin", validateSignin, login);

// Products routes (public for viewing, auth for admin only operations)
router.use("/products", productsRouter);

// Orders routes (authentication handled within router)
router.use("/orders", ordersRouter);

// Upload routes
router.use("/upload", uploadRouter);

// Payment routes
router.use("/payment", paymentRouter);

// Protected routes (require authentication)
router.use("/users", auth, usersRouter);

module.exports = router;
