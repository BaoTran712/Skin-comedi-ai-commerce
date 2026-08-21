import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/user.model.js";
import Order from "./src/models/order.model.js";

dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/ebookshelf";

const firstNames = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý"];
const lastNames = ["Anh", "Bình", "Cường", "Dung", "Hoa", "Hùng", "Hương", "Khánh", "Lan", "Linh", "Minh", "Nam", "Nga", "Ngọc", "Phúc", "Quang", "Tâm", "Thảo", "Trang", "Tuấn", "Thành", "Thủy", "Hải", "Sơn"];
const domains = ["gmail.com", "yahoo.com", "outlook.com"];

function getRandomDateInPastYear() {
    const now = new Date();
    // Tilted towards being older so they have been around for a while
    const randomDaysAgo = Math.floor(Math.pow(Math.random(), 0.8) * 365);
    return new Date(now.getTime() - randomDaysAgo * 24 * 60 * 60 * 1000);
}

function getRandomPhone() {
    return `0${Math.floor(Math.random() * 8 + 1)}${Math.floor(Math.random() * 90000000).toString().padStart(8, '0')}`;
}

async function seed() {
    try {
        await mongoose.connect(MONGODB_URL);
        console.log("Connected to MongoDB for user seeding...");

        const usersToCreate = 100;
        console.log(`Generating ${usersToCreate} realistic customers...`);
        
        const createdUsers = [];

        for (let i = 0; i < usersToCreate; i++) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const signupDate = getRandomDateInPastYear();
            
            const user = new User({
                first_name: firstName,
                last_name: lastName,
                username: `user_${Math.floor(Math.random() * 999999)}`,
                email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}@${domains[Math.floor(Math.random() * domains.length)]}`,
                password: "password123", // placeholder
                birthday: new Date(signupDate.getTime() - (Math.floor(Math.random() * 20 + 15) * 365 * 24 * 60 * 60 * 1000)), // 15-35 years old
                gender: Math.random() > 0.5,
                role: "user",
                points: Math.floor(Math.random() * 5000),
                rank: ["bronze", "silver", "gold", "diamond"][Math.floor(Math.random() * 4)],
                addresses: [{
                    label: "Nhà riêng",
                    address: `${Math.floor(Math.random() * 500) + 1} Đường số ${Math.floor(Math.random() * 20) + 1}, TP.HCM`,
                    phone: getRandomPhone(),
                    isDefault: true
                }]
            });
            
            await user.save({ timestamps: false });
            // Force createdAt to reflect the past signup date
            await User.updateOne({ _id: user._id }, { $set: { createdAt: signupDate, updatedAt: signupDate } });
            
            createdUsers.push(user);
        }

        console.log(`Successfully created ${createdUsers.length} users!`);

        console.log("Distributing existing orders randomly across these new customers...");
        const orders = await Order.find({});
        
        for (const order of orders) {
            const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
            order.user_id = randomUser._id;
            order.phone_number = randomUser.addresses[0].phone;
            order.shipping_address = randomUser.addresses[0].address;
            
            // Ensure order date is strictly ON or AFTER the user's signup date
            if (order.order_date < randomUser.createdAt) {
                const diff = randomUser.createdAt.getTime() - order.order_date.getTime();
                order.order_date = new Date(order.order_date.getTime() + diff + 86400000); // 1 day after signup
                order.delivery_date = new Date(order.order_date.getTime() + 86400000 * 2);
            }

            await order.save({ timestamps: false });
        }
        
        console.log(`Re-assigned ${orders.length} orders to the new customer list to simulate a real business ecosystem.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
