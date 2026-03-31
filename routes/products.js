const router = require("express").Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/products");
const {
  validateCreateProduct,
  validateUpdateProduct,
  validateProductId,
} = require("../middlewares/validation");
const auth = require("../middlewares/auth");
const requireAdmin = require("../middlewares/admin");

// Public routes - anyone can view products
router.get("/", getProducts);
router.get("/:productId", validateProductId, getProductById);

// Admin-only routes
router.post("/", auth, requireAdmin, validateCreateProduct, createProduct);
router.patch(
  "/:productId",
  auth,
  requireAdmin,
  validateProductId,
  validateUpdateProduct,
  updateProduct,
);
router.delete(
  "/:productId",
  auth,
  requireAdmin,
  validateProductId,
  deleteProduct,
);

module.exports = router;
