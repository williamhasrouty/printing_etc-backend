const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
} = require("../errors/errors");
const { JWT_SECRET } = require("../config/config");

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
  const { name, phone } = req.body;

  User.findByIdAndUpdate(
    req.user._id,
    { name, phone },
    { new: true, runValidators: true },
  )
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
      if (err.name === "ValidationError") {
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

module.exports = {
  createUser,
  login,
  getCurrentUser,
  updateUser,
  addAddress,
  updateAddress,
  deleteAddress,
};
