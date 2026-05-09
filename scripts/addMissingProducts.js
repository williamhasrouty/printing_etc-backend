const mongoose = require("mongoose");
const Product = require("../models/product");
const config = require("../config/config");

/**
 * SAFE PRODUCT ADDITION SCRIPT
 * Adds products that don't exist yet WITHOUT deleting existing ones
 * Use this to add new products to your catalog safely
 *
 * Usage: node scripts/addMissingProducts.js
 */

// Define products to check/add (only products not already in database)
const productsToAdd = [
  // Add new products here as needed
  // Example:
  // {
  //   name: "New Product",
  //   category: "new-category",
  //   basePrice: 10,
  //   // ... other fields
  // }
];

async function addMissingProducts() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(config.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    console.log("\nChecking for missing products...");

    let addedCount = 0;
    let skippedCount = 0;

    for (const productData of productsToAdd) {
      // Check if product already exists by name or category
      const existing = await Product.findOne({
        $or: [{ name: productData.name }, { category: productData.category }],
      });

      if (existing) {
        console.log(`⏭️  Skipping "${productData.name}" - already exists`);
        skippedCount++;
      } else {
        // Add the new product
        await Product.create(productData);
        console.log(`✅ Added "${productData.name}"`);
        addedCount++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("Summary:");
    console.log(`✅ Added: ${addedCount} new products`);
    console.log(`⏭️  Skipped: ${skippedCount} existing products`);
    console.log("=".repeat(50));

    if (addedCount === 0 && productsToAdd.length === 0) {
      console.log("\nℹ️  No products defined in this script.");
      console.log("Edit scripts/addMissingProducts.js to add new products.");
    }
  } catch (error) {
    console.error("❌ Error adding products:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\nDatabase connection closed");
  }
}

// Run the script
addMissingProducts();
