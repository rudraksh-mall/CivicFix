/**
 * Seed script to create an initial admin account.
 * Run: npm run seed-admin
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../src/models/user.model.js";
import { DB_NAME } from "../src/constants.js";

dotenv.config();

const EMAIL = process.env.ADMIN_EMAIL || "admin@civicfix.com";
const PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";
const NAME = process.env.ADMIN_NAME || "System Admin";

await mongoose.connect(`${process.env.MONGODB_URI}?dbName=${DB_NAME}`);
console.log("Connected to DB:", mongoose.connection.name);

const existing = await User.findOne({ email: EMAIL });
if (existing) {
  console.log("Admin already exists:", EMAIL);
  process.exit(0);
}

await User.create({
  name: NAME,
  email: EMAIL,
  password: PASSWORD,
  role: "admin",
  isVerified: true,
  isActive: true,
});

console.log("Admin created:");
console.log(`  Email: ${EMAIL}`);
console.log(`  Password: ${PASSWORD}`);
console.log("  Role: admin");
process.exit(0);
