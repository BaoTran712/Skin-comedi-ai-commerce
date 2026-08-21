import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import User from "./src/models/user.model.js";
import Staff from "./src/models/staff.model.js";
import Position from "./src/models/position.model.js";
import Brand from "./src/models/brand.model.js";
import Category from "./src/models/category.model.js";
import Supplier from "./src/models/supplier.model.js";
import Product from "./src/models/product.model.js";
import Promotion from "./src/models/promotion.model.js";
import Setting from "./src/models/setting.model.js";
import Order from "./src/models/order.model.js";
import OrderDetail from "./src/models/order_detail.model.js";
import Payment from "./src/models/payment.model.js";
import ShippingTracking from "./src/models/shipping_tracking.model.js";
import ImportReceipt from "./src/models/import_receipt.model.js";
import ImportReceiptDetail from "./src/models/import_receipt_detail.model.js";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/ebookshelf";

const lastNames = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý"];
const middleNames = ["Thị", "Văn", "Đức", "Minh", "Hồng", "Ngọc", "Kim", "Xuân", "Thành", "Hữu", "Quốc", "Gia", "Tú", "Thanh", "Như", "Khánh"];
const firstNames = ["Anh", "Bình", "Cường", "Dung", "Hoa", "Hùng", "Hương", "Khánh", "Lan", "Linh", "Minh", "Nam", "Nga", "Ngọc", "Phúc", "Quang", "Tâm", "Thảo", "Trang", "Tuấn", "Thành", "Thủy", "Hải", "Sơn"];
const domains = ["gmail.test", "yahoo.test", "outlook.test"];

const demoAddresses = [
    {
        label: "Nhà riêng",
        provinceCode: "92",
        provinceName: "Thành phố Cần Thơ",
        districtCode: "916",
        districtName: "Quận Ninh Kiều",
        wardCode: "31114",
        wardName: "Phường An Khánh",
        addressDetail: "123 Đường 3/2"
    },
    {
        label: "Văn phòng",
        provinceCode: "79",
        provinceName: "Thành phố Hồ Chí Minh",
        districtCode: "760",
        districtName: "Quận 1",
        wardCode: "26734",
        wardName: "Phường Bến Nghé",
        addressDetail: "45 Lê Lợi"
    },
    {
        label: "Nhà riêng",
        provinceCode: "01",
        provinceName: "Thành phố Hà Nội",
        districtCode: "001",
        districtName: "Quận Ba Đình",
        wardCode: "00001",
        wardName: "Phường Phúc Xá",
        addressDetail: "12 Yên Phụ"
    },
    {
        label: "Nhà riêng",
        provinceCode: "48",
        provinceName: "Thành phố Đà Nẵng",
        districtCode: "490",
        districtName: "Quận Hải Châu",
        wardCode: "20197",
        wardName: "Phường Hòa Cường Bắc",
        addressDetail: "78 Nguyễn Hữu Thọ"
    }
];

function randomDate(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime())) {
        throw new Error(`Demo seed date error: startDate is invalid. Value: ${startDate}`);
    }

    if (Number.isNaN(end.getTime())) {
        throw new Error(`Demo seed date error: endDate is invalid. Value: ${endDate}`);
    }

    return new Date(
        start.getTime() +
        Math.random() * (end.getTime() - start.getTime())
    );
}

function getRandomPhone() {
    return `0${Math.floor(Math.random() * 8 + 1)}${Math.floor(Math.random() * 90000000).toString().padStart(8, '0')}`;
}

async function runSeed() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB successfully!");

        // 1. Fetch products & staff (for admin_id)
        let products = await Product.find({});
        if (products.length === 0) {
            console.log("No products found in DB. Seeding fallback products list...");
            console.error("LƯU Ý: Vui lòng chạy 'npm run seed' trước để có danh mục, nhãn hàng và sản phẩm cơ sở.");
            process.exit(1);
        }

        let admin = await Staff.findOne({ username: "admin" });
        if (!admin) {
            console.log("No admin staff found. Creating default admin staff...");
            const adminPosition = await Position.findOne({ name: "Quản trị viên" }) || new Position({
                name: "Quản trị viên",
                description: "Toàn quyền hệ thống",
                permissions: ["ALL"]
            });
            await adminPosition.save();

            const hashedPassword = await bcrypt.hash("123456", 12);
            admin = new Staff({
                name: "Admin System",
                username: "admin",
                password: hashedPassword,
                address: "Can Tho",
                phone: "0123456789",
                position_id: adminPosition._id,
                hire_date: new Date()
            });
            await admin.save();
        }

        // 2. Fetch/Create suppliers
        console.log("Upserting demo suppliers...");
        const supplierNames = ["DEMO Supplier CeraVe", "DEMO Supplier Bioderma", "DEMO Supplier La Roche-Posay"];
        const suppliers = [];
        for (const sName of supplierNames) {
            let s = await Supplier.findOne({ name: sName });
            if (!s) {
                s = new Supplier({
                    name: sName,
                    address: "Hồ Chí Minh",
                    phone: "0909999999"
                });
                await s.save();
            }
            suppliers.push(s);
        }

        // 3. Generate Customer Users Idempotently
        console.log("Generating 80 Customer Users...");
        const demoCustomers = [];
        const hashedPassword = await bcrypt.hash("123456", 12);
        
        for (let i = 1; i <= 80; i++) {
            const indexStr = String(i).padStart(3, '0');
            const email = `customer${indexStr}@example.test`;
            const username = `customer${indexStr}`;
            const phone = `0987000${indexStr}`;
            
            // 90% ACTIVE, 10% INACTIVE
            const status = i <= 72 ? "ACTIVE" : "INACTIVE";

            let user = await User.findOne({ 
                $or: [
                    { username },
                    { email },
                    { phone }
                ]
            });
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = `${lastNames[Math.floor(Math.random() * lastNames.length)]} ${middleNames[Math.floor(Math.random() * middleNames.length)]}`;
            
            const randomDaysAgo = Math.floor(Math.random() * 300) + 60; // 60 - 360 days ago
            const signupDate = new Date(Date.now() - randomDaysAgo * 24 * 60 * 60 * 1000);
            
            const randomAddr = demoAddresses[Math.floor(Math.random() * demoAddresses.length)];

            const payload = {
                first_name: firstName,
                last_name: lastName,
                username,
                password: hashedPassword,
                birthday: new Date(signupDate.getTime() - (Math.floor(Math.random() * 20 + 18) * 365 * 24 * 60 * 60 * 1000)), // 18-38 years old
                gender: Math.random() > 0.5,
                role: "user",
                isVerified: true,
                status,
                phone,
                points: Math.floor(Math.random() * 1000),
                rank: ["bronze", "silver", "gold"][Math.floor(Math.random() * 3)],
                addresses: [{
                    label: randomAddr.label,
                    provinceCode: randomAddr.provinceCode,
                    provinceName: randomAddr.provinceName,
                    districtCode: randomAddr.districtCode,
                    districtName: randomAddr.districtName,
                    wardCode: randomAddr.wardCode,
                    wardName: randomAddr.wardName,
                    addressDetail: randomAddr.addressDetail,
                    phone: phone,
                    isDefault: true
                }]
            };

            if (user) {
                // Update
                await User.updateOne({ _id: user._id }, { $set: payload });
                user = await User.findById(user._id);
            } else {
                // Create
                user = new User(payload);
                await user.save({ timestamps: false });
                await User.updateOne({ _id: user._id }, { $set: { createdAt: signupDate, updatedAt: signupDate } });
            }

            const customerObj = user.toObject ? user.toObject() : user;
            customerObj.createdAtDate = signupDate;

            if (!customerObj.createdAtDate || !(customerObj.createdAtDate instanceof Date) || Number.isNaN(customerObj.createdAtDate.getTime())) {
                throw new Error(`Demo seed date error: customerObj.createdAtDate is invalid for user ${email}. Value: ${customerObj.createdAtDate}`);
            }

            demoCustomers.push(customerObj);
        }

        // 4. Clean Previous Demo Orders & Imports
        console.log("Cleaning previous demo orders and imports...");
        const existingDemoOrders = await Order.find({ order_code: /^ORD-DEMO-/ });
        const demoOrderIds = existingDemoOrders.map(o => o._id);
        
        await OrderDetail.deleteMany({ order_id: { $in: demoOrderIds } });
        await Payment.deleteMany({ order_id: { $in: demoOrderIds } });
        await ShippingTracking.deleteMany({ order_id: { $in: demoOrderIds } });
        await Order.deleteMany({ _id: { $in: demoOrderIds } });

        const existingDemoImports = await ImportReceipt.find({ note: "DEMO IMPORT" });
        const demoImportIds = existingDemoImports.map(i => i._id);
        await ImportReceiptDetail.deleteMany({ import_receipt_id: { $in: demoImportIds } });
        await ImportReceipt.deleteMany({ _id: { $in: demoImportIds } });

        // 5. Generate Demo Orders
        console.log("Generating 200 Demo Orders...");
        const ordersToSeed = 200;
        
        const createdOrders = [];
        const soldQuantities = {};
        
        for (const p of products) {
            soldQuantities[p._id.toString()] = 0;
        }

        for (let i = 1; i <= ordersToSeed; i++) {
            const customer = demoCustomers[Math.floor(Math.random() * demoCustomers.length)];
            
            const orderDate = randomDate(customer.createdAtDate, new Date());
            
            if (!(orderDate instanceof Date) || Number.isNaN(orderDate.getTime())) {
                throw new Error(`Demo seed date error: orderDate is invalid. Value: ${orderDate}`);
            }

            const diffTime = Math.abs(Date.now() - orderDate.getTime());
            const randomDaysAgo = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            let status = "delivered";
            if (randomDaysAgo === 0) {
                const r = Math.random();
                if (r < 0.3) status = "pending";
                else if (r < 0.6) status = "confirmed";
                else status = "shipping";
            } else if (randomDaysAgo < 3) {
                const r = Math.random();
                if (r < 0.2) status = "confirmed";
                else if (r < 0.5) status = "shipping";
                else status = "delivered";
            } else {
                const r = Math.random();
                if (r < 0.12) status = "cancelled";
                else if (r < 0.3) status = "completed";
                else status = "delivered";
            }

            const paymentMethod = ["COD", "VNPAY", "BANK_TRANSFER"][Math.floor(Math.random() * 3)];
            let paymentStatus = "unpaid";
            if (status === "delivered" || status === "completed") {
                paymentStatus = "paid";
            } else if (paymentMethod !== "COD") {
                paymentStatus = Math.random() < 0.8 ? "paid" : "unpaid";
            }

            const shippingMethod = Math.random() > 0.3 ? "standard" : "express";
            const shippingFee = shippingMethod === "express" ? 50000 : 30000;

            const numItems = Math.floor(Math.random() * 3) + 1;
            const shuffledProducts = [...products].sort(() => 0.5 - Math.random());
            const selectedProducts = shuffledProducts.slice(0, numItems);

            let subtotal = 0;
            const itemsData = [];

            for (const prod of selectedProducts) {
                const qty = Math.floor(Math.random() * 2) + 1;
                const price = prod.flash_sale_price || prod.price;
                subtotal += price * qty;
                
                itemsData.push({
                    product_id: prod._id,
                    quantity: qty,
                    price_at_purchase: price
                });

                if (status !== "cancelled") {
                    soldQuantities[prod._id.toString()] += qty;
                }
            }

            const discountAmount = Math.random() < 0.25 ? (Math.random() > 0.5 ? 20000 : 50000) : 0;
            const totalAmount = subtotal + shippingFee - Math.min(discountAmount, subtotal * 0.5);

            const userAddr = customer.addresses[0];
            const order_code = `ORD-DEMO-${String(i).padStart(6, '0')}`;

            const order = new Order({
                order_code,
                user_id: customer._id,
                staff_id: admin._id,
                order_date: orderDate,
                delivery_date: status === "delivered" || status === "completed" ? new Date(orderDate.getTime() + 2 * 24 * 60 * 60 * 1000) : undefined,
                shipping_address: {
                    provinceCode: userAddr.provinceCode,
                    provinceName: userAddr.provinceName,
                    districtCode: userAddr.districtCode,
                    districtName: userAddr.districtName,
                    wardCode: userAddr.wardCode,
                    wardName: userAddr.wardName,
                    addressDetail: userAddr.addressDetail
                },
                phone_number: userAddr.phone,
                status,
                payment_method: paymentMethod,
                shipping_method: shippingMethod,
                shipping_fee: shippingFee,
                subtotal,
                discount_amount: discountAmount,
                total_amount: totalAmount,
                note: `DEMO ORDER #${i}`
            });

            await order.save({ timestamps: false });
            await Order.updateOne({ _id: order._id }, { $set: { createdAt: orderDate, updatedAt: orderDate } });

            // Create OrderDetails
            for (const item of itemsData) {
                const detail = new OrderDetail({
                    order_id: order._id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price_at_purchase: item.price_at_purchase
                });
                await detail.save();
            }

            // Create Payment
            const transaction_id = paymentMethod === "VNPAY"
                ? `VNP-DEMO-${String(i).padStart(6, '0')}`
                : paymentMethod === "BANK_TRANSFER"
                    ? `DEMO-BANK-${String(i).padStart(6, '0')}`
                    : `COD-DEMO-${String(i).padStart(6, '0')}`;

            const payment = new Payment({
                order_id: order._id,
                user_id: customer._id,
                payment_method: paymentMethod,
                payment_status: paymentStatus,
                amount: totalAmount,
                transaction_id
            });
            await payment.save();

            // Create Shipping Tracking
            const tracking = new ShippingTracking({
                order_id: order._id,
                status: status,
                location: "Hệ thống kho vận",
                description: status === "pending" ? "Đang chờ xử lý" : (status === "confirmed" ? "Đã xác nhận đơn hàng" : (status === "cancelled" ? "Đơn hàng đã hủy" : "Hoàn thành giao hàng"))
            });
            await tracking.save();

            createdOrders.push(order);
        }

        // 6. Generate Weekly Imports
        console.log("Generating 12 weeks of weekly imports...");
        const importedQuantities = {};
        for (const p of products) {
            importedQuantities[p._id.toString()] = 0;
        }

        for (let w = 1; w <= 12; w++) {
            const importDate = new Date(Date.now() - w * 7 * 24 * 60 * 60 * 1000);
            if (!(importDate instanceof Date) || Number.isNaN(importDate.getTime())) {
                throw new Error(`Demo seed date error: importDate is invalid. Value: ${importDate}`);
            }
            const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
            
            const numProds = Math.floor(Math.random() * 4) + 3;
            const shuffledProducts = [...products].sort(() => 0.5 - Math.random());
            const selectedProducts = shuffledProducts.slice(0, numProds);

            let receiptTotal = 0;
            const itemsData = [];

            for (const prod of selectedProducts) {
                const qty = Math.floor(Math.random() * 50) + 30;
                const unitCost = Math.round(prod.price * 0.65);
                receiptTotal += qty * unitCost;

                itemsData.push({
                    product_id: prod._id,
                    quantity: qty,
                    import_price: unitCost
                });

                importedQuantities[prod._id.toString()] += qty;
            }

            const receipt = new ImportReceipt({
                staff_id: admin._id,
                supplier_id: supplier._id,
                import_date: importDate,
                total_amount: receiptTotal,
                note: "DEMO IMPORT"
            });

            await receipt.save({ timestamps: false });
            await ImportReceipt.updateOne({ _id: receipt._id }, { $set: { createdAt: importDate, updatedAt: importDate } });

            for (const item of itemsData) {
                const detail = new ImportReceiptDetail({
                    import_receipt_id: receipt._id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    import_price: item.import_price
                });
                await detail.save();
            }
        }

        // 7. Update Inventory Consistent with Formula
        console.log("Aligning inventory levels consistently...");
        for (const prod of products) {
            const sold = soldQuantities[prod._id.toString()] || 0;
            const imported = importedQuantities[prod._id.toString()] || 0;
            
            const currentStockTarget = Math.floor(Math.random() * 80) + 30;
            const opening = Math.max(10, currentStockTarget + sold - imported);
            const currentStockCalculated = opening + imported - sold;

            await Product.updateOne(
                { _id: prod._id },
                { $set: { quantity: currentStockCalculated } }
            );
        }

        // 8. Generate Summary Statistics Report
        console.log("\n========================================");
        console.log("DEMO DATA SEEDING COMPLETE");
        console.log("========================================");
        
        const totalUsers = await User.countDocuments({ role: "user" });
        const activeUsers = await User.countDocuments({ role: "user", status: "ACTIVE" });
        const inactiveUsers = await User.countDocuments({ role: "user", status: "INACTIVE" });
        const totalOrders = await Order.countDocuments();
        const demoOrdersCount = await Order.countDocuments({ order_code: /^ORD-DEMO-/ });
        
        const pendingCount = await Order.countDocuments({ status: "pending" });
        const confirmedCount = await Order.countDocuments({ status: "confirmed" });
        const shippingCount = await Order.countDocuments({ status: "shipping" });
        const deliveredCount = await Order.countDocuments({ status: "delivered" });
        const completedCount = await Order.countDocuments({ status: "completed" });
        const cancelledCount = await Order.countDocuments({ status: "cancelled" });

        const paidCount = await Payment.countDocuments({ payment_status: "paid" });
        const unpaidCount = await Payment.countDocuments({ payment_status: "unpaid" });

        const demoReceipts = await ImportReceipt.find({ note: "DEMO IMPORT" });
        const demoReceiptsCount = demoReceipts.length;

        const deliveredOrdersList = await Order.find({ status: { $in: ["delivered", "completed"] }, order_code: /^ORD-DEMO-/ });
        const totalRevenue = deliveredOrdersList.reduce((acc, order) => acc + (order.total_amount || 0), 0);

        let totalSoldProducts = 0;
        const demoOrders = await Order.find({ order_code: /^ORD-DEMO-/ });
        const demoOrderIdsForStats = demoOrders.map(o => o._id);
        const demoOrderDetails = await OrderDetail.find({ order_id: { $in: demoOrderIdsForStats } });
        for (const d of demoOrderDetails) {
            const associatedOrder = demoOrders.find(o => o._id.toString() === d.order_id.toString());
            if (associatedOrder && associatedOrder.status !== "cancelled") {
                totalSoldProducts += d.quantity;
            }
        }

        const allProducts = await Product.find({});
        const totalCurrentInventory = allProducts.reduce((acc, p) => acc + (p.quantity || 0), 0);

        console.log(`Customers created/updated (DEMO): 80 (Total in DB: ${totalUsers})`);
        console.log(`  - ACTIVE: ${activeUsers}`);
        console.log(`  - INACTIVE: ${inactiveUsers}`);
        console.log(`Orders generated (DEMO): ${demoOrdersCount} (Total in DB: ${totalOrders})`);
        console.log(`Weekly imports generated: ${demoReceiptsCount} receipts`);
        console.log(`Suppliers: ${await Supplier.countDocuments()}`);
        console.log(`Total revenue generated (Delivered/Completed DEMO): ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRevenue)}`);
        console.log(`Total products sold (Non-cancelled DEMO): ${totalSoldProducts}`);
        console.log(`Current inventory quantity (Total all products): ${totalCurrentInventory}`);
        console.log("\nOrder Status Distribution (All DB):");
        console.log(`  - Pending: ${pendingCount}`);
        console.log(`  - Confirmed: ${confirmedCount}`);
        console.log(`  - Shipping: ${shippingCount}`);
        console.log(`  - Delivered: ${deliveredCount}`);
        console.log(`  - Completed: ${completedCount}`);
        console.log(`  - Cancelled: ${cancelledCount}`);
        console.log("\nPayment Status (All DB):");
        console.log(`  - Paid: ${paidCount}`);
        console.log(`  - Pending/Unpaid: ${unpaidCount}`);
        console.log("========================================\n");

        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
}

runSeed();
