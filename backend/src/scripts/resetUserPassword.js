require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function run() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.log("❌ Usage: node src/scripts/resetUserPassword.js <email> <newPassword>");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    console.log(`❌ User not found: ${email}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(newPassword, salt);

  await User.updateOne({ _id: user._id }, { $set: { password: hashed } });

  console.log(`✅ Password reset for ${user.email} (role=${user.role})`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(async (err) => {
  console.error("❌ Error:", err);
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});
