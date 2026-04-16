const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/user");
const {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
} = require("../errors/errors");
const { JWT_SECRET } = require("../config/config");
const { sendPasswordResetEmail } = require("../utils/email");

// Create a new user (signup)
const createUser = (req, res, next) => {
  const { email, password, name, phone } = req.body;

  bcrypt
    .hash(password, 10)
    .then((hash) =>
      User.create({
        email,
        password: hash,
        name,
        phone,
      }),
    )
    .then((user) => {
      res.status(201).send({
        _id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        createdAt: user.createdAt,
      });
    })
    .catch((err) => {
      if (err.code === 11000) {
        next(new ConflictError("Email already exists"));
      } else if (err.name === "ValidationError") {
        next(new BadRequestError("Invalid data provided"));
      } else {
        next(err);
      }
    });
};

// Login user
const login = (req, res, next) => {
  const { email, password } = req.body;

  User.findOne({ email })
    .select("+password")
    .then((user) => {
      if (!user) {
        throw new UnauthorizedError("Incorrect email or password");
      }

      return bcrypt.compare(password, user.password).then((matched) => {
        if (!matched) {
          throw new UnauthorizedError("Incorrect email or password");
        }

        const token = jwt.sign(
          { _id: user._id, role: user.role || "customer" },
          JWT_SECRET,
          { expiresIn: "7d" },
        );

        return res.send({
          token,
          user: {
            _id: user._id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: user.role || "customer",
          },
        });
      });
    })
    .catch(next);
};

// Get current user info
const getCurrentUser = (req, res, next) => {
  User.findById(req.user._id)
    .then((user) => {
      if (!user) {
        throw new NotFoundError("User not found");
      }
      res.send({
        _id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
        createdAt: user.createdAt,
      });
    })
    .catch(next);
};

// Update user profile
const updateUser = (req, res, next) => {
  const { name, phone, email } = req.body;

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (email !== undefined) updates.email = email;

  User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  })
    .then((user) => {
      if (!user) {
        throw new NotFoundError("User not found");
      }
      res.send({
        _id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
      });
    })
    .catch((err) => {
      if (err.code === 11000) {
        next(new ConflictError("Email already exists"));
      } else if (err.name === "ValidationError") {
        next(new BadRequestError("Invalid data provided"));
      } else {
        next(err);
      }
    });
};

// Add address
const addAddress = (req, res, next) => {
  const { label, street, city, state, zipCode, country, isDefault } = req.body;

  User.findById(req.user._id)
    .then((user) => {
      if (!user) {
        throw new NotFoundError("User not found");
      }

      // If this is set as default, unset other defaults
      if (isDefault) {
        user.addresses.forEach((addr) => {
          addr.isDefault = false;
        });
      }

      user.addresses.push({
        label,
        street,
        city,
        state,
        zipCode,
        country: country || "USA",
        isDefault: isDefault || user.addresses.length === 0, // First address is default
      });

      return user.save();
    })
    .then((user) => {
      res.status(201).send({ addresses: user.addresses });
    })
    .catch((err) => {
      if (err.name === "ValidationError") {
        next(new BadRequestError("Invalid address data"));
      } else {
        next(err);
      }
    });
};

// Update address
const updateAddress = (req, res, next) => {
  const { addressId } = req.params;
  const { label, street, city, state, zipCode, country, isDefault } = req.body;

  User.findById(req.user._id)
    .then((user) => {
      if (!user) {
        throw new NotFoundError("User not found");
      }

      const address = user.addresses.id(addressId);
      if (!address) {
        throw new NotFoundError("Address not found");
      }

      // If setting as default, unset other defaults
      if (isDefault) {
        user.addresses.forEach((addr) => {
          addr.isDefault = false;
        });
      }

      // Update address fields
      if (label !== undefined) address.label = label;
      if (street !== undefined) address.street = street;
      if (city !== undefined) address.city = city;
      if (state !== undefined) address.state = state;
      if (zipCode !== undefined) address.zipCode = zipCode;
      if (country !== undefined) address.country = country;
      if (isDefault !== undefined) address.isDefault = isDefault;

      return user.save();
    })
    .then((user) => {
      res.send({ addresses: user.addresses });
    })
    .catch((err) => {
      if (err.name === "ValidationError") {
        next(new BadRequestError("Invalid address data"));
      } else {
        next(err);
      }
    });
};

// Delete address
const deleteAddress = (req, res, next) => {
  const { addressId } = req.params;

  User.findById(req.user._id)
    .then((user) => {
      if (!user) {
        throw new NotFoundError("User not found");
      }

      const address = user.addresses.id(addressId);
      if (!address) {
        throw new NotFoundError("Address not found");
      }

      address.deleteOne();
      return user.save();
    })
    .then((user) => {
      res.send({ addresses: user.addresses });
    })
    .catch(next);
};

// Update password
const updatePassword = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  User.findById(req.user._id)
    .select("+password")
    .then((user) => {
      if (!user) {
        throw new NotFoundError("User not found");
      }

      // Verify current password
      return bcrypt.compare(currentPassword, user.password).then((matched) => {
        if (!matched) {
          throw new UnauthorizedError("Current password is incorrect");
        }

        // Hash new password
        return bcrypt.hash(newPassword, 10).then((hash) => {
          user.password = hash;
          return user.save();
        });
      });
    })
    .then((user) => {
      res.send({
        _id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
      });
    })
    .catch(next);
};

// Request password reset
const forgotPassword = (req, res, next) => {
  const { email } = req.body;

  User.findOne({ email })
    .select("+resetPasswordToken +resetPasswordExpires")
    .then((user) => {
      if (!user) {
        // Don't reveal if user exists for security
        return res.send({
          message:
            "If an account exists with this email, you will receive password reset instructions shortly.",
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      // Set reset token and expiration (1 hour)
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

      return user.save().then(() => {
        // Send reset email
        sendPasswordResetEmail(user.email, resetToken)
          .then(() => {
            res.send({
              message:
                "If an account exists with this email, you will receive password reset instructions shortly.",
            });
          })
          .catch((err) => {
            console.error("Failed to send password reset email:", err);
            // Still return success message for security
            res.send({
              message:
                "If an account exists with this email, you will receive password reset instructions shortly.",
            });
          });
      });
    })
    .catch(next);
};

// Reset password with token
const resetPassword = (req, res, next) => {
  const { token, newPassword } = req.body;

  // Hash the token to compare with database
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  })
    .select("+resetPasswordToken +resetPasswordExpires +password")
    .then((user) => {
      if (!user) {
        throw new BadRequestError("Invalid or expired reset token");
      }

      // Hash new password and clear reset fields
      return bcrypt.hash(newPassword, 10).then((hash) => {
        user.password = hash;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        return user.save();
      });
    })
    .then((user) => {
      res.send({
        message: "Password successfully reset. You can now log in.",
      });
    })
    .catch(next);
};

module.exports = {
  createUser,
  login,
  getCurrentUser,
  updateUser,
  updatePassword,
  addAddress,
  updateAddress,
  deleteAddress,
  forgotPassword,
  resetPassword,
};
