import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./src/models/product.model.js";
import Brand from "./src/models/brand.model.js";
import Category from "./src/models/category.model.js";

dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/ebookshelf";

const brandsData = [
    { name: "La Roche-Posay", address: "Pháp" },
    { name: "Cerave", address: "Mỹ" },
    { name: "Vichy", address: "Pháp" },
    { name: "Obagi", address: "Mỹ" },
    { name: "Eucerin", address: "Đức" },
    { name: "Paula's Choice", address: "Mỹ" },
    { name: "Kiehl's", address: "Mỹ" },
    { name: "Neutrogena", address: "Mỹ" }
];

const categoriesData = [
    { name: "Sữa rửa mặt", description: "Làm sạch da" },
    { name: "Toner / Nước hoa hồng", description: "Cân bằng da" },
    { name: "Serum / Tinh chất", description: "Đặc trị chuyên sâu" },
    { name: "Kem dưỡng ẩm", description: "Cấp ẩm, phục hồi" },
    { name: "Kem chống nắng", description: "Bảo vệ da" },
    { name: "Tẩy tế bào chết", description: "Làm mới làn da" },
    { name: "Sản phẩm trị mụn", description: "Dành riêng cho da mụn" }
];

const productTemplates = [
    { title: "Gel rửa mặt làm sạch sâu", usage: "Làm sạch sâu bụi bẩn, bã nhờn.", price_range: [300000, 500000] },
    { title: "Sữa rửa mặt dịu nhẹ cho da nhạy cảm", usage: "Làm sạch nhẹ nhàng không gây khô da.", price_range: [350000, 550000] },
    { title: "Nước hoa hồng cân bằng ẩm", usage: "Cấp ẩm tức thì, cân bằng độ pH.", price_range: [400000, 700000] },
    { title: "Serum phục hồi B5", usage: "Phục hồi hàng rào bảo vệ da, giảm kích ứng.", price_range: [800000, 1200000] },
    { title: "Tinh chất sáng da mờ thâm Vitamin C", usage: "Làm sáng da, chống oxy hóa mạnh mẽ.", price_range: [1000000, 1500000] },
    { title: "Kem dưỡng ẩm chuyên sâu", usage: "Cung cấp độ ẩm dồi dào suốt 24h.", price_range: [450000, 800000] },
    { title: "Kem chống nắng kiểm soát nhờn SPF 50", usage: "Bảo vệ da tuyệt đối khỏi tia UV, kiềm dầu.", price_range: [400000, 600000] },
    { title: "Dung dịch tẩy tế bào chết BHA 2%", usage: "Làm sạch lỗ chân lông, hỗ trợ trị mụn.", price_range: [700000, 950000] },
    { title: "Kem chấm mụn sưng viêm", usage: "Giảm sưng tấy, gom cồi mụn nhanh chóng.", price_range: [250000, 450000] },
    { title: "Mặt nạ đất sét giảm mụn ẩn", usage: "Hút dầu thừa, thanh lọc lỗ chân lông.", price_range: [300000, 500000] }
];

async function seed() {
    try {
        await mongoose.connect(MONGODB_URL);
        console.log("Connected to MongoDB for product seeding...");

        // 1. Seed Brands
        const insertedBrands = [];
        for (const b of brandsData) {
            let brand = await Brand.findOne({ name: b.name });
            if (!brand) {
                brand = await Brand.create(b);
            }
            insertedBrands.push(brand);
        }
        console.log(`Ensured ${insertedBrands.length} brands exist.`);

        // 2. Seed Categories
        const insertedCats = [];
        for (const c of categoriesData) {
            let cat = await Category.findOne({ name: c.name });
            if (!cat) {
                cat = await Category.create(c);
            }
            insertedCats.push(cat);
        }
        console.log(`Ensured ${insertedCats.length} categories exist.`);

        // 3. Generate 50 realistic products
        console.log("Generating 50 random products...");
        let createdCount = 0;
        
        for (let i = 0; i < 50; i++) {
            const randomBrand = insertedBrands[Math.floor(Math.random() * insertedBrands.length)];
            const randomCat = insertedCats[Math.floor(Math.random() * insertedCats.length)];
            const template = productTemplates[Math.floor(Math.random() * productTemplates.length)];
            
            // Customize title by prepending Brand name
            const fullTitle = `${randomBrand.name} - ${template.title} ${Math.floor(Math.random() * 999)}`;
            
            // Random price within range, rounded to thousands
            const minPrice = template.price_range[0];
            const maxPrice = template.price_range[1];
            const price = Math.floor(Math.random() * (maxPrice - minPrice) / 1000) * 1000 + minPrice;
            
            const quantity = Math.floor(Math.random() * 150) + 10;
            const expiryYear = 2026 + Math.floor(Math.random() * 3);
            
            const newProduct = new Product({
                title: fullTitle,
                price: price,
                quantity: quantity,
                expiry_date: `12/${expiryYear}`,
                brand_id: randomBrand._id,
                category_id: randomCat._id,
                usage: template.usage,
                skin_type: ["Da nhạy cảm", "Mọi loại da"],
                pathology: ["Mụn", "Thâm"],
                image: "https://via.placeholder.com/300x300.png?text=Skin+Care",
                images: ["https://via.placeholder.com/600x600.png?text=Skin+Care"],
                origin_country: randomBrand.address,
                batch_number: `BCH-00${Math.floor(Math.random() * 900) + 100}`,
                prescription_required: Math.random() < 0.1 // 10% need rx
            });
            
            await newProduct.save();
            createdCount++;
        }

        console.log(`Successfully generated ${createdCount} products!`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
