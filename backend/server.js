import "dotenv/config";
import app from "./app.js";
import config from "./src/config/index.js";
import mongoose from "mongoose";

const PORT = config.src.port;

async function autoMigrateRoles() {
    try {
        const User = (await import("./src/models/user.model.js")).default;
        const Staff = (await import("./src/models/staff.model.js")).default;

        const users = await User.find({});
        for (const u of users) {
            let r = (u.role || "CUSTOMER").toString().trim().toUpperCase();
            if (r === "USER" || r === "CUSTOMER") r = "CUSTOMER";
            else if (r === "STAFF" || r === "EMPLOYEE") r = "STAFF";
            else if (r === "ADMIN") r = "ADMIN";
            else r = "CUSTOMER";

            if (u.role !== r) {
                u.role = r;
                await u.save();
            }
        }

        const staffs = await Staff.find({});
        for (const s of staffs) {
            let r = (s.role || "STAFF").toString().trim().toUpperCase();
            if (r === "ADMIN") r = "ADMIN";
            else r = "STAFF";

            if (s.role !== r) {
                s.role = r;
                await s.save();
            }
        }
        console.log("Role system verified & auto-migrated to [ADMIN, STAFF, CUSTOMER].");
    } catch (err) {
        console.error("Auto role migration error:", err);
    }
}

async function startServer() {
    try {
        await mongoose.connect(config.db.uri);
        console.log("Connected to the database!");

        await autoMigrateRoles();

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

    } catch (error) {
        console.log(`Cannot connect to the database! ${error}`);
        process.exit();
    }
}

startServer();
