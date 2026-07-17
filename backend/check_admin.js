import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import Staff from "./src/models/staff.model.js";
import Position from "./src/models/position.model.js";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URL || "mongodb://localhost:27017/ebookshelf";

async function checkAndResetAdmin() {
    try {
        console.log("📡 Đang kết nối database:", MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log("✅ Kết nối MongoDB thành công!\n");

        // Tìm tài khoản admin
        const admin = await Staff.findOne({ username: "admin" }).populate("position_id");

        if (!admin) {
            console.log("❌ Không tìm thấy tài khoản admin!");
            console.log("👉 Đang tạo lại tài khoản admin...\n");

            // Tìm hoặc tạo position admin
            let adminPosition = await Position.findOne({ name: "Quản trị viên" });
            if (!adminPosition) {
                adminPosition = new Position({
                    name: "Quản trị viên",
                    description: "Toàn quyền hệ thống",
                    permissions: ["ALL"]
                });
                await adminPosition.save();
                console.log("✅ Đã tạo Position: Quản trị viên");
            }

            const hashedPassword = await bcrypt.hash("123456", 12);
            const newAdmin = new Staff({
                name: "Admin System",
                username: "admin",
                password: hashedPassword,
                address: "Can Tho",
                phone: "0123456789",
                position_id: adminPosition._id,
                hire_date: new Date(),
                status: "active"
            });
            await newAdmin.save();
            console.log("✅ Tạo tài khoản admin thành công!");
            console.log("   Username: admin");
            console.log("   Password: 123456");
        } else {
            console.log("✅ Tìm thấy tài khoản admin:");
            console.log("   Tên     :", admin.name);
            console.log("   Username:", admin.username);
            console.log("   Chức vụ :", admin.position_id?.name || "N/A");
            console.log("   Trạng thái:", admin.status);
            console.log("   Rank    :", admin.rank);
            console.log("");

            // Reset mật khẩu về 123456
            const hashedPassword = await bcrypt.hash("123456", 12);
            await Staff.updateOne({ username: "admin" }, { password: hashedPassword });
            console.log("🔄 Đã reset mật khẩu về: 123456");
            console.log("   Username: admin");
            console.log("   Password: 123456");
        }

        console.log("\n🎉 Hoàn thành! Vào trang admin tại: http://localhost:5173/admin/login");
        process.exit(0);
    } catch (error) {
        console.error("❌ Lỗi:", error.message);
        process.exit(1);
    }
}

checkAndResetAdmin();
