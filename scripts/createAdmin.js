import "dotenv/config";
import bcrypt from "bcryptjs";

import { connectDB } from "../config/db.js";
import User from "../models/User.js";

await connectDB();

const email = process.env.ADMIN_EMAIL.toLowerCase();

const password = await bcrypt.hash(
  process.env.ADMIN_PASSWORD,
  10
);

const existing = await User.findOne({ email });

if (existing) {
  existing.name = process.env.ADMIN_NAME;
  existing.password = password;
  existing.role = "admin";
  await existing.save();

  console.log("Existing user updated as admin");
} else {
  await User.create({
    name: process.env.ADMIN_NAME,
    email,
    password,
    role: "admin",
  });

  console.log("Admin created");
}

process.exit(0);
