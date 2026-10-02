/**
 * seedOwner.js
 *
 * Manually creates the Lassi Wassi owner account in MongoDB.
 * Run once from the server/ directory:
 *
 *   node scripts/seedOwner.js
 *
 * The script is idempotent — it will NOT create a duplicate if the
 * email already exists.
 */

import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

// ── Hard-coded owner credentials ──────────────────────────────────────────────
const OWNER = {
  name:     "Lassi Wassi Owner",
  email:    "owner@lassiwassi.com",
  password: "Owner@123",
  phone:    "9999999999",
  role:     "owner",
};

// ── Inline minimal schema (avoids pulling the full app model graph) ───────────
const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    phone:    { type: String, required: true },
    role:     { type: String, enum: ["customer", "owner", "admin"], default: "customer" },
  },
  { timestamps: true }
);

// Use the same model name so Mongoose reuses it if already registered
const User = mongoose.models.User || mongoose.model("User", userSchema);

async function seed() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("❌  MONGO_URI is not set. Add it to your .env file.");
    process.exit(1);
  }

  console.log("🔌  Connecting to MongoDB…");
  await mongoose.connect(uri);
  console.log("✅  MongoDB connected");

  // Hash password
  const salt           = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(OWNER.password, salt);

  // Create or repair the owner account so the seeded login always works.
  const existing = await User.findOne({ email: OWNER.email });

  if (existing) {
    await User.updateOne(
      { email: OWNER.email },
      {
        $set: {
          name: OWNER.name,
          password: hashedPassword,
          phone: OWNER.phone,
          role: OWNER.role,
        },
      }
    );

    console.log(`✅  Owner account updated successfully (${OWNER.email}).`);
  } else {
    await User.create({
      name:     OWNER.name,
      email:    OWNER.email,
      password: hashedPassword,
      phone:    OWNER.phone,
      role:     OWNER.role,
    });

    console.log("🎉  Owner account created successfully!");
  }
  console.log(`    Email   : ${OWNER.email}`);
  console.log(`    Password: ${OWNER.password}`);
  console.log(`    Role    : ${OWNER.role}`);
  console.log("\n⚠️   Change these credentials after first login!");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err.message);
  mongoose.disconnect();
  process.exit(1);
});
