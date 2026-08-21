import mongoose from "mongoose";
import dotenv from "dotenv";
import ImportReceipt from "./src/models/import_receipt.model.js";
import ImportReceiptDetail from "./src/models/import_receipt_detail.model.js";
import Product from "./src/models/product.model.js";
import Supplier from "./src/models/supplier.model.js";
import Staff from "./src/models/staff.model.js";

dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/ebookshelf";

async function seed() {
    try {
        await mongoose.connect(MONGODB_URL);
        console.log("Connected to MongoDB for import receipts seeding...");

        // 1. Ensure at least one Supplier exists
        let supplier = await Supplier.findOne({});
        if (!supplier) {
            supplier = await Supplier.create({
                name: "Nhà cung cấp Dược Phẩm Lớn",
                email: "contact@nccduoc.vn",
                phone: "0987654321",
                address: "Khu Công Nghiệp Tân Bình, TP.HCM"
            });
        }

        // 2. Ensure at least one Staff exists
        let staff = await Staff.findOne({ role: "staff" });
        if (!staff) {
            staff = await Staff.create({
                first_name: "Quản",
                last_name: "Lý Kho",
                username: "quanlykho",
                password: "password123", // Will not be hashed here but it's just a dummy
                phone: "0999999999",
                role: "staff"
            });
        }

        // 3. Get all products
        const products = await Product.find({});
        if (products.length === 0) {
            console.log("No products found! Please run seed-products.js first.");
            process.exit(1);
        }

        console.log("Generating 24 import receipts (2 per month for the last 12 months)...");
        const now = new Date();
        let createdCount = 0;

        for (let i = 0; i < 24; i++) {
            const randomDaysAgo = Math.floor(Math.random() * 365);
            const importDate = new Date(now.getTime() - randomDaysAgo * 24 * 60 * 60 * 1000);

            // Select 3 to 8 random products to import
            const numProducts = Math.floor(Math.random() * 6) + 3;
            const shuffled = [...products].sort(() => 0.5 - Math.random());
            const selectedProducts = shuffled.slice(0, numProducts);

            let total_amount = 0;
            const itemsToInsert = [];

            for (const prod of selectedProducts) {
                // Import price is roughly 60-70% of retail price
                const import_price = Math.floor(prod.price * (Math.random() * 0.1 + 0.6) / 1000) * 1000;
                const quantity = Math.floor(Math.random() * 50) + 20;

                total_amount += (import_price * quantity);

                itemsToInsert.push({
                    product_id: prod._id,
                    quantity,
                    import_price
                });
            }

            // Create Receipt
            const receipt = new ImportReceipt({
                staff_id: staff._id,
                supplier_id: supplier._id,
                total_amount,
                note: `Nhập kho định kỳ lô hàng ${i + 1}`,
            });
            await receipt.save({ timestamps: false });
            await ImportReceipt.updateOne({ _id: receipt._id }, { $set: { import_date: importDate, createdAt: importDate, updatedAt: importDate } });

            // Create Details
            for (const item of itemsToInsert) {
                item.import_receipt_id = receipt._id;
                await ImportReceiptDetail.create(item);
            }

            createdCount++;
        }

        console.log(`Successfully generated ${createdCount} import receipts with detailed line items.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
