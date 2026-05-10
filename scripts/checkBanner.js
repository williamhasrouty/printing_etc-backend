const mongoose = require("mongoose");
require("dotenv").config();

const Product = require("../models/product");

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/printing_etc")
  .then(() => {
    console.log("Connected to MongoDB");
    return Product.findOne({
      $or: [{ name: /banner/i }, { category: /banner/i }],
    });
  })
  .then((product) => {
    if (!product) {
      console.log("No banner product found");
      process.exit(0);
    }
    console.log("\n=== Banner Product ===");
    console.log("Name:", product.name);
    console.log("Category:", product.category);
    console.log("Base Price:", product.basePrice);
    console.log(
      "\nStandard Sizes:",
      JSON.stringify(product.options?.sizes || [], null, 2),
    );
    console.log(
      "\nCustom Options:",
      JSON.stringify(product.options?.customOptions || {}, null, 2),
    );
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
