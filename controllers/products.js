const Product = require("../models/product");
const { BadRequestError, NotFoundError } = require("../errors/errors");

// Get all products
const getProducts = (req, res, next) => {
  const { category, featured, inStock } = req.query;
  const filter = {};

  if (category) {
    filter.category = category;
  }
  if (featured !== undefined) {
    filter.featured = featured === "true";
  }
  if (inStock !== undefined) {
    filter.inStock = inStock === "true";
  }

  Product.find(filter)
    .sort({ position: 1, createdAt: -1 })
    .then((products) => res.send(products))
    .catch(next);
};

// Get a single product by ID
const getProductById = (req, res, next) => {
  const { productId } = req.params;

  Product.findById(productId)
    .then((product) => {
      if (!product) {
        throw new NotFoundError("Product not found");
      }
      res.send(product);
    })
    .catch((err) => {
      if (err.name === "CastError") {
        next(new BadRequestError("Invalid product ID"));
      } else {
        next(err);
      }
    });
};

// Create a new product (admin only - will add admin middleware later)
const createProduct = (req, res, next) => {
  const {
    name,
    description,
    category,
    basePrice,
    imageUrl,
    images,
    options,
    inStock,
    featured,
  } = req.body;

  Product.create({
    name,
    description,
    category,
    basePrice,
    imageUrl,
    images,
    options,
    inStock,
    featured,
  })
    .then((product) => res.status(201).send(product))
    .catch((err) => {
      if (err.name === "ValidationError") {
        next(new BadRequestError("Invalid data provided"));
      } else {
        next(err);
      }
    });
};

// Update a product (admin only - will add admin middleware later)
const updateProduct = (req, res, next) => {
  const { productId } = req.params;
  const {
    name,
    description,
    category,
    basePrice,
    imageUrl,
    images,
    options,
    inStock,
    featured,
  } = req.body;

  Product.findByIdAndUpdate(
    productId,
    {
      name,
      description,
      category,
      basePrice,
      imageUrl,
      images,
      options,
      inStock,
      featured,
      updatedAt: Date.now(),
    },
    { new: true, runValidators: true },
  )
    .then((product) => {
      if (!product) {
        throw new NotFoundError("Product not found");
      }
      res.send(product);
    })
    .catch((err) => {
      if (err.name === "CastError") {
        next(new BadRequestError("Invalid product ID"));
      } else if (err.name === "ValidationError") {
        next(new BadRequestError("Invalid data provided"));
      } else {
        next(err);
      }
    });
};

// Delete a product (admin only - will add admin middleware later)
const deleteProduct = (req, res, next) => {
  const { productId } = req.params;

  Product.findByIdAndDelete(productId)
    .then((product) => {
      if (!product) {
        throw new NotFoundError("Product not found");
      }
      res.send({ message: "Product deleted successfully" });
    })
    .catch((err) => {
      if (err.name === "CastError") {
        next(new BadRequestError("Invalid product ID"));
      } else {
        next(err);
      }
    });
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
