const router = require("express").Router();
const {
  getCurrentUser,
  updateUser,
  updatePassword,
  addAddress,
  updateAddress,
  deleteAddress,
} = require("../controllers/users");
const {
  validateUpdateUser,
  validateUpdatePassword,
  validateAddress,
  validateAddressId,
} = require("../middlewares/validation");

// GET /users/me - get current user info
router.get("/me", getCurrentUser);

// PATCH /users/me - update current user profile
router.patch("/me", validateUpdateUser, updateUser);

// PATCH /users/me/password - update password
router.patch("/me/password", validateUpdatePassword, updatePassword);

// POST /users/me/addresses - add new address
router.post("/me/addresses", validateAddress, addAddress);

// PATCH /users/me/addresses/:addressId - update address
router.patch(
  "/me/addresses/:addressId",
  validateAddressId,
  validateAddress,
  updateAddress,
);

// DELETE /users/me/addresses/:addressId - delete address
router.delete("/me/addresses/:addressId", validateAddressId, deleteAddress);

module.exports = router;
