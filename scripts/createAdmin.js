// Run this script to make a user admin
// Usage: node scripts/createAdmin.js your-email@example.com

const mongoose = require("mongoose");
const User = require("../models/user");
const { MONGODB_URI } = require("../config/config");

const email = process.argv[2];

if (!email) {
  console.error("❌ Please provide an email address");
  console.log("Usage: node scripts/createAdmin.js your-email@example.com");
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    return User.findOneAndUpdate(
      { email: email },
      { $set: { role: "admin" } },
      { new: true },
    );
  })
  .then((user) => {
    if (!user) {
      console.error(`❌ No user found with email: ${email}`);
      console.log("\n📝 To create a new user:");
      console.log("1. Register at: http://localhost:3001");
      console.log("2. Then run this script again with your email");
    } else {
      console.log(`\n✅ Success! User updated to admin:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(
        `\n🎉 You can now access the admin dashboard at: http://localhost:3001/admin`,
      );
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
  });
