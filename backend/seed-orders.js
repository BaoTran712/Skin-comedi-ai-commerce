import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "./src/models/order.model.js";
import User from "./src/models/user.model.js";
import Product from "./src/models/product.model.js";

dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/ebookshelf";

async function seed() {
    try {
        await mongoose.connect(MONGODB_URL);
        console.log("Connected to MongoDB for seeding...");

        // Fix low stock products
        const products = await Product.find({});
        if (products.length > 0) {
            // Set first 5 products to low stock
            for (let i = 0; i < Math.min(5, products.length); i++) {
                products[i].quantity = Math.floor(Math.random() * 8) + 1; // 1 to 8
                await products[i].save();
            }
            // Set the rest to higher stock
            for (let i = 5; i < products.length; i++) {
                products[i].quantity = Math.floor(Math.random() * 50) + 20;
                await products[i].save();
            }
            console.log("Updated inventory quantities for low stock reporting.");
        }

        // Fetch a user to attach orders to
        let user = await User.findOne({ role: "user" });
        if (!user) {
            console.log("No normal user found. Creating a dummy user.");
            user = new User({
                first_name: "Khách",
                last_name: "Hàng Mẫu",
                email: "dummy@example.com",
                password: "password123", // Assuming validation allows this
                phone: "0901234567",
                role: "user"
            });
            await user.save();
        }
        
        const userId = user._id;
        
        console.log("Generating realistic past orders for the last 12 months...");
        const now = new Date();
        const numOrders = 800; // ~2-3 orders per day for a year
        
        for (let i = 0; i < numOrders; i++) {
            // Random date in the past 365 days, weighted slightly towards recent
            const randomDaysAgo = Math.floor(Math.pow(Math.random(), 1.2) * 365);
            const date = new Date(now.getTime() - randomDaysAgo * 24 * 60 * 60 * 1000);
            
            const totalAmount = Math.floor(Math.random() * 25 + 5) * 100000;
            
            // Determine status based on how recent it is
            let status = "completed";
            if (randomDaysAgo === 0) {
                const recentRoll = Math.random();
                if (recentRoll < 0.4) status = "pending";
                else if (recentRoll < 0.7) status = "confirmed";
                else status = "shipping";
            } else if (randomDaysAgo < 3) {
                status = Math.random() < 0.5 ? "shipping" : "delivered";
            } else if (randomDaysAgo > 300 && Math.random() < 0.1) {
                status = "cancelled"; // some cancellations for realism
            }
                
                const order = new Order({
                    user_id: userId,
                    order_date: date,
                    delivery_date: date, // assume delivered same day for simplicity
                    shipping_address: "123 Seed Address",
                    phone_number: "0901234567",
                    status: status,
                    payment_method: "VNPAY",
                    subtotal: totalAmount,
                    total_amount: totalAmount,
                });
                
                await order.save({ timestamps: false }); 
                // Force createdAt and updatedAt
                await Order.updateOne({ _id: order._id }, { $set: { createdAt: date, updatedAt: date } });
            }

            console.log(`Successfully inserted ${numOrders} seeded orders.`);
        

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
