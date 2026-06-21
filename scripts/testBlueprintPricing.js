#!/usr/bin/env node
/**
 * Test script to verify blueprints pricing table calculations
 */

const mongoose = require("mongoose");
const Product = require("../models/product");
const { calculateItemPrice } = require("../utils/pricing");
const config = require("../config/config");

async function testBlueprintPricing() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const blueprint = await Product.findOne({ name: /Blueprints/i });

    if (!blueprint) {
      console.error("❌ Blueprints product not found");
      process.exit(1);
    }

    console.log("📋 Testing Blueprints/Floor Plans Pricing\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Test cases
    const testCases = [
      {
        desc: "Black & White - 18x24 - 1 copy",
        options: { color: "Black & White", size: '18" x 24"', quantity: "1" },
        expectedPrice: 2.25,
      },
      {
        desc: "Black & White - 24x36 - 5 copies",
        options: { color: "Black & White", size: '24" x 36"', quantity: "5" },
        expectedPrice: 25,
      },
      {
        desc: "Full Color - 18x24 - 1 copy",
        options: { color: "Full Color", size: '18" x 24"', quantity: "1" },
        expectedPrice: 3.5,
      },
      {
        desc: "Full Color - 24x36 - 3 copies",
        options: { color: "Full Color", size: '24" x 36"', quantity: "3" },
        expectedPrice: 24,
      },
      {
        desc: "Full Color - 36x48 - 10 copies",
        options: { color: "Full Color", size: '36" x 48"', quantity: "10" },
        expectedPrice: 150,
      },
      {
        desc: "Black & White - 30x42 - 7 copies",
        options: { color: "Black & White", size: '30" x 42"', quantity: "7" },
        expectedPrice: 45.5,
      },
    ];

    let passCount = 0;
    let failCount = 0;

    for (const test of testCases) {
      const result = calculateItemPrice(blueprint, test.options, 1);
      const match = result.price === test.expectedPrice;

      console.log(`Test: ${test.desc}`);
      console.log(`  Expected: $${test.expectedPrice}`);
      console.log(`  Got:      $${result.price}`);
      console.log(`  Status:   ${match ? "✅ PASS" : "❌ FAIL"}`);
      console.log("");

      if (match) passCount++;
      else failCount++;
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`\n📊 Results: ${passCount} passed, ${failCount} failed\n`);

    if (failCount === 0) {
      console.log("🎉 All pricing calculations are correct!\n");
    } else {
      console.log("⚠️  Some pricing calculations failed. Please review.\n");
    }

    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

testBlueprintPricing();
