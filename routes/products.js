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

// Public routes - anyone can view products
router.get("/", getProducts);
router.get("/:productId", validateProductId, getProductById);

// Admin-only routes (will add admin middleware later)
router.post("/", validateCreateProduct, createProduct);
router.patch(
  "/:productId",
  validateProductId,
  validateUpdateProduct,
  updateProduct,
);
router.delete("/:productId", validateProductId, deleteProduct);

module.exports = router;
