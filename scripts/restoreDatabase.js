const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Product = require("../models/product");
const Order = require("../models/order");
const config = require("../config/config");

/**
 * SAFE DATABASE RESTORE SCRIPT
 * Restores database from a backup file
 *
 * Usage:
 *   node scripts/restoreDatabase.js                    (uses latest backup)
 *   node scripts/restoreDatabase.js backup-file.json   (uses specific backup)
 */

async function restoreDatabase() {
  try {
    // Determine which backup file to use
    const backupDir = path.join(__dirname, "../backups");
    let backupFile;

    if (process.argv[2]) {
      // Use specified backup file
      backupFile = path.join(backupDir, process.argv[2]);
    } else {
      // Use latest backup
      backupFile = path.join(backupDir, "latest-backup.json");
    }

    // Check if backup file exists
    if (!fs.existsSync(backupFile)) {
      console.error(`❌ Backup file not found: ${backupFile}`);
      console.log("\nAvailable backups:");
      if (fs.existsSync(backupDir)) {
        const files = fs
          .readdirSync(backupDir)
          .filter((f) => f.endsWith(".json"));
        files.forEach((f) => console.log(`  - ${f}`));
      } else {
        console.log(
          "  No backups directory found. Run backupDatabase.js first.",
        );
      }
      process.exit(1);
    }

    console.log(`Reading backup from: ${backupFile}`);
    const backupData = JSON.parse(fs.readFileSync(backupFile, "utf8"));

    console.log(`\nBackup created: ${backupData.timestamp}`);
    console.log(`Contains:`);
    console.log(`- ${backupData.counts.products} products`);
    console.log(`- ${backupData.counts.users} users`);
    console.log(`- ${backupData.counts.orders} orders`);

    // Ask for confirmation (basic check)
    console.log(
      "\n⚠️  WARNING: This will DELETE all current data and restore from backup!",
    );
    console.log("To proceed, set CONFIRM_RESTORE=yes environment variable");

    if (process.env.CONFIRM_RESTORE !== "yes") {
      console.log("\n❌ Restore cancelled. To proceed, run:");
      console.log(`   CONFIRM_RESTORE=yes node scripts/restoreDatabase.js`);
      process.exit(0);
    }

    console.log("\nConnecting to MongoDB...");
    await mongoose.connect(config.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    console.log("\nClearing existing data...");
    await Product.deleteMany({});
    await Order.deleteMany({});
    console.log("✅ Existing data cleared");

    // Restore products
    if (backupData.collections.products.length > 0) {
      console.log("\nRestoring products...");
      await Product.insertMany(backupData.collections.products);
      console.log(
        `✅ Restored ${backupData.collections.products.length} products`,
      );
    }

    // Restore orders
    if (backupData.collections.orders.length > 0) {
      console.log("\nRestoring orders...");
      await Order.insertMany(backupData.collections.orders);
      console.log(`✅ Restored ${backupData.collections.orders.length} orders`);
    }

    console.log("\n✅ Database restore completed successfully!");
  } catch (error) {
    console.error("❌ Error restoring database:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\nDatabase connection closed");
  }
}

// Run the restore
restoreDatabase();
