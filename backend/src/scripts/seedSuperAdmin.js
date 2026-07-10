require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

const run = async () => {
  await connectDB();

  const email = "admin@emr.com";
  const existing = await User.findOne({ email });
  if (existing) {
    console.log("Super admin already exists.");
    process.exit(0);
  }

  await User.create({
    name: "Super Admin",
    email,
    password: "Admin@123", // change after first login
    role: "superadmin",
  });

  console.log("✅ Super admin created:", email, "/ password: Admin@123");
  process.exit(0);
};

run();