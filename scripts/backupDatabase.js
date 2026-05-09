const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Product = require("../models/product");
const User = require("../models/user");
const Order = require("../models/order");
const config = require("../config/config");

/**
 * SAFE DATABASE BACKUP SCRIPT
 * Creates a JSON backup of all database collections
 * Run this regularly to save your data!
 *
 * Usage: node scripts/backupDatabase.js
 */

async function backupDatabase() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(config.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Create backups directory if it doesn't exist
    const backupDir = path.join(__dirname, "../backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Generate timestamp for backup file
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

    console.log("\nBacking up database...");

    // Fetch all data
    const products = await Product.find({}).lean();
    const users = await User.find({}).select("-password").lean(); // Exclude passwords
    const orders = await Order.find({}).lean();

    const backup = {
      timestamp: new Date().toISOString(),
      collections: {
        products: products,
        users: users,
        orders: orders,
      },
      counts: {
        products: products.length,
        users: users.length,
        orders: orders.length,
      },
    };

    // Write backup to file
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

    console.log("\n✅ Database backup completed successfully!");
    console.log(`📁 Backup saved to: ${backupFile}`);
    console.log(`\nBackup contents:`);
    console.log(`- ${backup.counts.products} products`);
    console.log(`- ${backup.counts.users} users`);
    console.log(`- ${backup.counts.orders} orders`);

    // Also create a "latest" backup for easy access
    const latestFile = path.join(backupDir, "latest-backup.json");
    fs.writeFileSync(latestFile, JSON.stringify(backup, null, 2));
    console.log(`\n📝 Also saved as: ${latestFile}`);
  } catch (error) {
    console.error("❌ Error backing up database:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\nDatabase connection closed");
  }
}

// Run the backup
backupDatabase();
