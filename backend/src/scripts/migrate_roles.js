import mongoose from "mongoose";
import config from "../config/index.js";
import User from "../models/user.model.js";
import Staff from "../models/staff.model.js";

async function migrateRoles() {
  await mongoose.connect(config.db.uri);
  console.log("Connected to MongoDB for role migration...");

  // 1. Migrate Users collection
  const users = await User.find({});
  let userCount = 0;
  for (const u of users) {
    let oldRole = (u.role || "user").toString().trim().toUpperCase();
    let newRole = "CUSTOMER";
    if (oldRole === "ADMIN" || oldRole === "ADMINISTRATOR") {
      newRole = "ADMIN";
    } else if (oldRole === "STAFF" || oldRole === "EMPLOYEE") {
      newRole = "STAFF";
    } else {
      newRole = "CUSTOMER";
    }

    if (u.role !== newRole) {
      u.role = newRole;
      await u.save();
      userCount++;
    }
  }
  console.log(`Migrated ${userCount} User records to standardized uppercase roles.`);

  // 2. Migrate Staffs collection
  const staffs = await Staff.find({});
  let staffCount = 0;
  for (const s of staffs) {
    let oldRole = (s.role || "staff").toString().trim().toUpperCase();
    let newRole = "STAFF";
    if (oldRole === "ADMIN" || oldRole === "ADMINISTRATOR") {
      newRole = "ADMIN";
    } else {
      newRole = "STAFF";
    }

    if (s.role !== newRole) {
      s.role = newRole;
      await s.save();
      staffCount++;
    }
  }
  console.log(`Migrated ${staffCount} Staff records to standardized uppercase roles.`);

  await mongoose.disconnect();
  console.log("Role migration completed successfully.");
}

migrateRoles().catch(err => {
  console.error("Role Migration Error:", err);
  process.exit(1);
});
