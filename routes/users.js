const router = require('express').Router();
const {
  getCurrentUser,
  updateUser,
} = require('../controllers/users');
const { validateUpdateUser } = require('../middlewares/validation');

// GET /users/me - get current user info
router.get('/me', getCurrentUser);

// PATCH /users/me - update current user profile
router.patch('/me', validateUpdateUser, updateUser);

module.exports = router;
