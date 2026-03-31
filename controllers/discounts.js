const DiscountCode = require("../models/discountCode");
const { BadRequestError, NotFoundError } = require("../errors/errors");

// Validate discount code
const validateDiscountCode = (req, res, next) => {
  const { code, orderAmount } = req.body;

  if (!code) {
    return next(new BadRequestError("Discount code required"));
  }

  DiscountCode.findOne({ code: code.toUpperCase() })
    .then((discount) => {
      if (!discount) {
        throw new NotFoundError("Invalid discount code");
      }

      if (!discount.isValid()) {
        throw new BadRequestError("Discount code is not valid or has expired");
      }

      if (orderAmount < discount.minOrderAmount) {
        throw new BadRequestError(
          `Minimum order amount of $${discount.minOrderAmount} required`,
        );
      }

      // Check per-user limit if user is authenticated
      if (req.user && discount.perUserLimit) {
        // This would require tracking usage per user (could add to order model)
        // For now, we'll skip this check
      }

      const discountAmount = discount.calculateDiscount(orderAmount);

      res.send({
        code: discount.code,
        description: discount.description,
        discountAmount,
        validUntil: discount.validUntil,
      });
    })
    .catch(next);
};

// Create discount code (admin only)
const createDiscountCode = (req, res, next) => {
  const {
    code,
    description,
    type,
    value,
    minOrderAmount,
    maxDiscount,
    usageLimit,
    perUserLimit,
    validFrom,
    validUntil,
    applicableCategories,
  } = req.body;

  DiscountCode.create({
    code: code.toUpperCase(),
    description,
    type,
    value,
    minOrderAmount,
    maxDiscount,
    usageLimit,
    perUserLimit,
    validFrom,
    validUntil,
    applicableCategories,
  })
    .then((discount) => {
      res.status(201).send(discount);
    })
    .catch((err) => {
      if (err.code === 11000) {
        next(new BadRequestError("Discount code already exists"));
      } else if (err.name === "ValidationError") {
        next(new BadRequestError("Invalid discount code data"));
      } else {
        next(err);
      }
    });
};

// Get all discount codes (admin only)
const getAllDiscountCodes = (req, res, next) => {
  const { isActive } = req.query;
  const filter = {};

  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }

  DiscountCode.find(filter)
    .sort({ createdAt: -1 })
    .then((discounts) => res.send(discounts))
    .catch(next);
};

// Update discount code (admin only)
const updateDiscountCode = (req, res, next) => {
  const { codeId } = req.params;
  const updateData = { ...req.body };

  if (updateData.code) {
    updateData.code = updateData.code.toUpperCase();
  }

  DiscountCode.findByIdAndUpdate(
    codeId,
    { ...updateData, updatedAt: Date.now() },
    { new: true, runValidators: true },
  )
    .then((discount) => {
      if (!discount) {
        throw new NotFoundError("Discount code not found");
      }
      res.send(discount);
    })
    .catch((err) => {
      if (err.name === "ValidationError") {
        next(new BadRequestError("Invalid discount code data"));
      } else {
        next(err);
      }
    });
};

// Delete discount code (admin only)
const deleteDiscountCode = (req, res, next) => {
  const { codeId } = req.params;

  DiscountCode.findByIdAndDelete(codeId)
    .then((discount) => {
      if (!discount) {
        throw new NotFoundError("Discount code not found");
      }
      res.send({ message: "Discount code deleted successfully" });
    })
    .catch(next);
};

module.exports = {
  validateDiscountCode,
  createDiscountCode,
  getAllDiscountCodes,
  updateDiscountCode,
  deleteDiscountCode,
};
