const router = require("express").Router();
const {
  validateDiscountCode,
  createDiscountCode,
  getAllDiscountCodes,
  updateDiscountCode,
  deleteDiscountCode,
} = require("../controllers/discounts");
const auth = require("../middlewares/auth");
const requireAdmin = require("../middlewares/admin");

// Public route - validate discount code
router.post("/validate", validateDiscountCode);

// Admin routes
router.post("/", auth, requireAdmin, createDiscountCode);
router.get("/", auth, requireAdmin, getAllDiscountCodes);
router.patch("/:codeId", auth, requireAdmin, updateDiscountCode);
router.delete("/:codeId", auth, requireAdmin, deleteDiscountCode);

module.exports = router;
