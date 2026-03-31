const { ForbiddenError } = require("../errors/errors");

// Middleware to check if user has admin role
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new ForbiddenError("Authentication required"));
  }

  if (req.user.role !== "admin") {
    return next(new ForbiddenError("Admin access required"));
  }

  next();
};

module.exports = requireAdmin;
