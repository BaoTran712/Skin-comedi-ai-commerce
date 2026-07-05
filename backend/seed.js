import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

import User from "./src/models/user.model.js";
import Staff from "./src/models/staff.model.js";
import Position from "./src/models/position.model.js";
import Brand from "./src/models/brand.model.js";
import Category from "./src/models/category.model.js";
import Supplier from "./src/models/supplier.model.js";
import Product from "./src/models/product.model.js";
import Promotion from "./src/models/promotion.model.js";
import Order from "./src/models/order.model.js";
import OrderDetail from "./src/models/order_detail.model.js";
import Payment from "./src/models/payment.model.js";
import ShippingTracking from "./src/models/shipping_tracking.model.js";
import ImportReceipt from "./src/models/import_receipt.model.js";
import ImportReceiptDetail from "./src/models/import_receipt_detail.model.js";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URL || "mongodb://localhost:27017/ebookshelf";

async function seedData() {
    try {
        console.log("Connecting to database...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB!");

        console.log("Clearing existing data...");
        await OrderDetail.deleteMany({});
        await Payment.deleteMany({});
        await ShippingTracking.deleteMany({});
        await Order.deleteMany({});
        await ImportReceiptDetail.deleteMany({});
        await ImportReceipt.deleteMany({});
        await Product.deleteMany({});
        await Promotion.deleteMany({});
        await Supplier.deleteMany({});
        await Category.deleteMany({});
        await Brand.deleteMany({});
        await Staff.deleteMany({});
        await Position.deleteMany({});
        await User.deleteMany({});

        const hashedPassword = await bcrypt.hash("123456", 12);

        console.log("Inserting Positions & Staff...");
        const adminPosition = new Position({
            name: "Quản trị viên",
            description: "Toàn quyền hệ thống",
            permissions: ["ALL"]
        });
        await adminPosition.save();

        const admin = new Staff({
            name: "Admin System",
            username: "admin",
            password: hashedPassword,
            address: "Can Tho",
            phone: "0123456789",
            position_id: adminPosition._id,
            hire_date: new Date()
        });
        await admin.save();

        console.log("Inserting Users...");
        const user1 = new User({
            first_name: "Nguyen",
            last_name: "A",
            username: "user1",
            password: hashedPassword,
            birthday: new Date("2000-01-01"),
            gender: true,
            address: "Ninh Kieu, Can Tho",
            phone: "0909000111"
        });
        await user1.save();

        console.log("Inserting Categories...");
        const cat1 = new Category({ name: "Sữa rửa mặt", description: "Làm sạch da mặt" });
        const cat2 = new Category({ name: "Kem dưỡng ẩm", description: "Cấp ẩm, phục hồi hàng rào bảo vệ da" });
        const cat3 = new Category({ name: "Tinh chất / Serum", description: "Các loại serum đặc trị mụn, thâm, chống lão hóa" });
        const cat4 = new Category({ name: "Kem chống nắng", description: "Bảo vệ da trước tác hại của tia UV" });
        const cat5 = new Category({ name: "Nước tẩy trang", description: "Tẩy sạch lớp trang điểm và bụi bẩn" });
        await cat1.save();
        await cat2.save();
        await cat3.save();
        await cat4.save();
        await cat5.save();

        console.log("Inserting Brands & Suppliers...");
        const brand1 = new Brand({ name: "La Roche-Posay", address: "France" });
        const brand2 = new Brand({ name: "CeraVe", address: "USA" });
        const brand3 = new Brand({ name: "Obagi Medical", address: "USA" });
        const brand4 = new Brand({ name: "Vichy", address: "France" });
        const brand5 = new Brand({ name: "Paula's Choice", address: "USA" });
        const brand6 = new Brand({ name: "The Ordinary", address: "Canada" });
        await brand1.save();
        await brand2.save();
        await brand3.save();
        await brand4.save();
        await brand5.save();
        await brand6.save();

        const supplier1 = new Supplier({ name: "Công ty L'Oréal VN", address: "Hồ Chí Minh", phone: "1800545463" });
        await supplier1.save();

        console.log("Inserting Promotions...");
        const promo1 = new Promotion({
            code: "WELCOME10",
            name: "Giảm 10% đơn đầu tiên",
            discount_type: "percentage",
            discount_value: 10,
            start_date: new Date(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            min_order_value: 500000,
            max_discount_amount: 100000,
            usage_limit: 100
        });
        await promo1.save();

        console.log("Inserting Products (20 products)...");
        const productsList = [
            {
                title: "Sữa rửa mặt La Roche-Posay Effaclar Purifying Foaming Gel",
                price: 385000,
                quantity: 50,
                expiry_date: "12/2026",
                brand_id: brand1._id,
                category_id: cat1._id,
                usage: "Làm sạch sâu, giảm nhờn, ngăn ngừa mụn",
                skin_type: ["da dầu", "da mụn"],
                pathology: ["mụn"],
                image: "https://www.laroche-posay.us/-/media/project/loreal/brand-sites/lrp/americas/us/products/effaclar/effaclar-purifying-foaming-gel-cleanser/effaclar-purifying-foaming-gel-for-oily-skin-200ml-702x702.png"
            },
            {
                title: "Kem dưỡng ẩm CeraVe Moisturising Cream",
                price: 450000,
                quantity: 30,
                expiry_date: "05/2025",
                brand_id: brand2._id,
                category_id: cat2._id,
                usage: "Cấp ẩm phục hồi hàng rào bảo vệ da",
                skin_type: ["da khô", "da nhạy cảm"],
                pathology: ["khô da"],
                image: "https://www.cerave.com/-/media/project/loreal/brand-sites/cerave/americas/us/products-v3/moisturizing-cream/700x875/moisturizing-cream-19oz-702x875.png"
            },
            {
                title: "Tinh chất Obagi Professional-C Serum 20%",
                price: 2350000,
                quantity: 15,
                expiry_date: "08/2026",
                brand_id: brand3._id,
                category_id: cat3._id,
                usage: "Chống oxy hóa mạnh mẽ, làm sáng và đều màu da",
                skin_type: ["da thường", "da dầu", "da hỗn hợp"],
                pathology: ["thâm sạm", "lão hóa"],
                image: "https://www.obagi.com/sites/default/files/styles/product_image/public/2023-10/ProfC_Serum20_30mL_Carton_Bottle_2023.png"
            },
            {
                title: "Kem chống nắng La Roche-Posay Anthelios UVMune 400",
                price: 475000,
                quantity: 40,
                expiry_date: "10/2026",
                brand_id: brand1._id,
                category_id: cat4._id,
                usage: "Bảo vệ da vượt trội trước tia UVA/UVB và bụi mịn",
                skin_type: ["da hỗn hợp", "da nhạy cảm"],
                pathology: ["nắng rát", "sạm da"],
                image: "https://www.laroche-posay.us/-/media/project/loreal/brand-sites/lrp/americas/us/products/anthelios/anthelios-melt-in-milk-sunscreen-spf-100/anthelios-melt-in-milk-body-face-sunscreen-lotion-spf-100-702x702.png"
            },
            {
                title: "Nước tẩy trang Bioderma Sensibio H2O 500ml",
                price: 420000,
                quantity: 60,
                expiry_date: "11/2026",
                brand_id: brand1._id,
                category_id: cat5._id,
                usage: "Làm sạch dịu nhẹ lớp trang điểm và bụi bẩn bám trên da",
                skin_type: ["da nhạy cảm", "mọi loại da"],
                pathology: ["mụn cám"],
                image: "https://www.bioderma.us/sites/us/files/styles/product_image/public/2022-02/bioderma-sensibio-h2o-500ml.png"
            },
            {
                title: "Sữa rửa mặt CeraVe Foaming Facial Cleanser",
                price: 390000,
                quantity: 45,
                expiry_date: "09/2026",
                brand_id: brand2._id,
                category_id: cat1._id,
                usage: "Làm sạch sâu bã nhờn mà không gây khô da",
                skin_type: ["da dầu", "da hỗn hợp"],
                pathology: ["mụn đầu đen"],
                image: "https://www.cerave.com/-/media/project/loreal/brand-sites/cerave/americas/us/products-v3/foaming-facial-cleanser/700x875/foaming-facial-cleanser-702x875.png"
            },
            {
                title: "Tinh chất Paula's Choice Clinical 1% Retinol Treatment",
                price: 1450000,
                quantity: 20,
                expiry_date: "03/2026",
                brand_id: brand5._id,
                category_id: cat3._id,
                usage: "Cải thiện nếp nhăn và thu nhỏ lỗ chân lông",
                skin_type: ["da lão hóa", "da khỏe"],
                pathology: ["nếp nhăn", "lão hóa"],
                image: "https://www.paulaschoice.com/dw/image/v2/BBNX_PRD/on/demandware.static/-/Sites-pc-catalog/default/dw92d32df6/images/products/clinical-1-retinol-treatment-8014-L.png"
            },
            {
                title: "Kem dưỡng ẩm Obagi Clinical Kinetin+ Hydrating Cream",
                price: 1350000,
                quantity: 25,
                expiry_date: "04/2026",
                brand_id: brand3._id,
                category_id: cat2._id,
                usage: "Cấp ẩm chuyên sâu, phục hồi da nhạy cảm thương tổn",
                skin_type: ["da nhạy cảm", "da yếu"],
                pathology: ["mẩn đỏ", "khô da"],
                image: "https://www.obagi.com/sites/default/files/styles/product_image/public/2023-10/Clinical_Kinetin_HydratingCream_50mL_Carton_Jar_2023.png"
            },
            {
                title: "Serum The Ordinary Niacinamide 10% + Zinc 1%",
                price: 220000,
                quantity: 80,
                expiry_date: "02/2026",
                brand_id: brand6._id,
                category_id: cat3._id,
                usage: "Làm sáng da, mờ thâm mụn và thu nhỏ lỗ chân lông",
                skin_type: ["mọi loại da", "da mụn"],
                pathology: ["thâm mụn"],
                image: "https://theordinary.com/dw/image/v2/BFKJ_PRD/on/demandware.static/-/Sites-deciem-master/default/dw9a2a94e3/Images/products/The%20Ordinary/rdn-niacinamide-10pct-zinc-1pct-30ml.png"
            },
            {
                title: "Kem chống nắng Vichy Capital Soleil Mattifying 3-in-1",
                price: 480000,
                quantity: 35,
                expiry_date: "07/2026",
                brand_id: brand4._id,
                category_id: cat4._id,
                usage: "Kiểm soát dầu nhờn, bảo vệ và nâng tông da tự nhiên",
                skin_type: ["da dầu", "da hỗn hợp thiên dầu"],
                pathology: ["bóng nhờn"],
                image: "https://www.vichy.com.vn/-/media/project/loreal/brand-sites/vichy/apac/vn/products/soleil/capital-soleil-uv-age-daily/capital-soleil-uv-age-daily-702x702.png"
            },
            {
                title: "Sữa rửa mặt Vichy Normaderm Phytosolution Gel Cleanser",
                price: 420000,
                quantity: 30,
                expiry_date: "01/2026",
                brand_id: brand4._id,
                category_id: cat1._id,
                usage: "Làm sạch bụi mịn, giảm bóng nhờn hiệu quả",
                skin_type: ["da dầu", "da mụn"],
                pathology: ["mụn sưng"],
                image: "https://www.vichy.com.vn/-/media/project/loreal/brand-sites/vichy/apac/vn/products/normaderm/normaderm-phytosolution-gel/normaderm-phytosolution-intensive-purifying-gel-200ml-702x702.png"
            },
            {
                title: "Kem dưỡng ẩm La Roche-Posay Cicaplast Baume B5+",
                price: 325000,
                quantity: 50,
                expiry_date: "06/2026",
                brand_id: brand1._id,
                category_id: cat2._id,
                usage: "Làm dịu và hỗ trợ phục hồi làn da đang kích ứng",
                skin_type: ["da nhạy cảm", "da tổn thương"],
                pathology: ["kích ứng", "ngứa rát"],
                image: "https://www.laroche-posay.us/-/media/project/loreal/brand-sites/lrp/americas/us/products/cicaplast/cicaplast-balm-b5-for-dry-skin-irritations/cicaplast-baume-b5-702x702.png"
            },
            {
                title: "Serum tẩy tế bào chết Paula's Choice Skin Perfecting 2% BHA Liquid",
                price: 950000,
                quantity: 40,
                expiry_date: "11/2026",
                brand_id: brand5._id,
                category_id: cat3._id,
                usage: "Tẩy tế bào chết hóa học, thông thoáng lỗ chân lông, ngăn mụn ẩn",
                skin_type: ["da dầu", "da hỗn hợp"],
                pathology: ["mụn ẩn", "mụn cám"],
                image: "https://www.paulaschoice.com/dw/image/v2/BBNX_PRD/on/demandware.static/-/Sites-pc-catalog/default/dwa3ab5a9e/images/products/skin-perfecting-2-bha-liquid-exfoliant-2010-L.png"
            },
            {
                title: "Tinh chất làm sáng da Klairs Freshly Juiced Vitamin Drop",
                price: 380000,
                quantity: 30,
                expiry_date: "05/2026",
                brand_id: brand6._id,
                category_id: cat3._id,
                usage: "Làm sáng, mờ vết thâm sạm và se khít lỗ chân lông",
                skin_type: ["da nhạy cảm", "da xỉn màu"],
                pathology: ["thâm sạm"],
                image: "https://www.klairs.com/web/product/big/201911/03b219dd0a92bed10ccee8d9a46e5e76.jpg"
            },
            {
                title: "Kem chống nắng Skin1004 Madagascar Centella Air-Fit Suncream",
                price: 345000,
                quantity: 50,
                expiry_date: "09/2026",
                brand_id: brand2._id,
                category_id: cat4._id,
                usage: "Kem chống nắng vật lý rau má làm dịu da lành tính",
                skin_type: ["da mụn", "da nhạy cảm"],
                pathology: ["kích ứng nhẹ"],
                image: "https://skin1004.com/web/product/big/202303/e8e2e2aab43c4ce2e8a0f44f3f76c4d3.jpg"
            },
            {
                title: "Nước tẩy trang L'Oreal Paris Micellar Water 3-in-1",
                price: 185000,
                quantity: 75,
                expiry_date: "08/2026",
                brand_id: brand1._id,
                category_id: cat5._id,
                usage: "Hút sạch cặn trang điểm và cấp ẩm mát mịn cho da",
                skin_type: ["mọi loại da", "da khô"],
                pathology: ["khô da nhẹ"],
                image: "https://www.lorealparisusa.com/-/media/project/loreal/brand-sites/oap/americas/us/products/skin-care/cleansers/micellar-cleansing-water-complete-cleanser-waterproof/micellar-cleansing-water-for-normal-to-oily-skin-702x702.png"
            },
            {
                title: "Sữa rửa mặt Cosrx Low pH Good Morning Gel Cleanser",
                price: 210000,
                quantity: 45,
                expiry_date: "07/2026",
                brand_id: brand6._id,
                category_id: cat1._id,
                usage: "Sữa rửa mặt dịu nhẹ, cân bằng độ pH tự nhiên của da",
                skin_type: ["mọi loại da", "da nhạy cảm"],
                pathology: ["mụn nhẹ"],
                image: "https://www.cosrx.com/cdn/shop/products/low-ph-good-morning-gel-cleanser_600x.jpg"
            },
            {
                title: "Kem dưỡng ẩm Neutrogena Hydro Boost Water Gel",
                price: 370000,
                quantity: 55,
                expiry_date: "12/2026",
                brand_id: brand2._id,
                category_id: cat2._id,
                usage: "Gel dưỡng ẩm cấp nước tức thì cho làn da ngậm nước khoẻ mạnh",
                skin_type: ["da dầu", "da thiếu nước"],
                pathology: ["thiếu nước"],
                image: "https://www.neutrogena.com/-/media/project/loreal/brand-sites/ngna/americas/us/products/hydro-boost/hydro-boost-hyaluronic-acid-water-gel-702x702.png"
            },
            {
                title: "Serum phục hồi da The Ordinary Hyaluronic Acid 2% + B5",
                price: 260000,
                quantity: 65,
                expiry_date: "11/2026",
                brand_id: brand6._id,
                category_id: cat3._id,
                usage: "Hỗ trợ cấp nước và phục hồi hàng rào bảo vệ tự nhiên",
                skin_type: ["da yếu", "da khô"],
                pathology: ["bong tróc", "khô da"],
                image: "https://theordinary.com/dw/image/v2/BFKJ_PRD/on/demandware.static/-/Sites-deciem-master/default/dwd2f3c6b4/Images/products/The%20Ordinary/rdn-hyaluronic-acid-2pct-b5-30ml.png"
            },
            {
                title: "Kem chống nắng Paula's Choice Resist Super-Light Wrinkle Defense SPF 30",
                price: 950000,
                quantity: 20,
                expiry_date: "10/2026",
                brand_id: brand5._id,
                category_id: cat4._id,
                usage: "Kem chống nắng vật lý dưỡng ẩm chống lão hoá nhẹ nhàng hàng ngày",
                skin_type: ["da dầu", "da lão hóa"],
                pathology: ["lão hóa nhẹ"],
                image: "https://www.paulaschoice.com/dw/image/v2/BBNX_PRD/on/demandware.static/-/Sites-pc-catalog/default/dw0c1e99e7/images/products/resist-super-light-wrinkle-defense-spf30-7790-L.png"
            }
        ];

        const createdProducts = [];
        for (const prodData of productsList) {
            const product = new Product(prodData);
            await product.save();
            createdProducts.push(product);
        }
        const p1 = createdProducts[0];
        const p2 = createdProducts[1];


        console.log("Inserting Import Receipt...");
        const receipt = new ImportReceipt({
            staff_id: admin._id,
            supplier_id: supplier1._id,
            total_amount: 10000000,
            note: "Nhập hàng đầu tháng"
        });
        await receipt.save();
        
        await new ImportReceiptDetail({
            import_receipt_id: receipt._id,
            product_id: p1._id,
            quantity: 50,
            import_price: 250000
        }).save();

        console.log("Inserting Order...");
        const order = new Order({
            user_id: user1._id,
            staff_id: admin._id,
            promotion_id: promo1._id,
            shipping_address: user1.address,
            phone_number: user1.phone,
            status: "shipping",
            carrier_name: "Giao Hàng Nhanh",
            tracking_number: "GHN123456789",
            subtotal: p1.price + p2.price,
            discount_amount: (p1.price + p2.price) * 0.1, // 10%
            total_amount: (p1.price + p2.price) * 0.9
        });
        await order.save();

        await new OrderDetail({
            order_id: order._id,
            product_id: p1._id,
            quantity: 1,
            price_at_purchase: p1.price
        }).save();

        await new OrderDetail({
            order_id: order._id,
            product_id: p2._id,
            quantity: 1,
            price_at_purchase: p2.price
        }).save();

        await new Payment({
            order_id: order._id,
            user_id: user1._id,
            payment_method: "VNPAY",
            payment_status: "paid",
            amount: order.total_amount,
            transaction_id: "VNP123456"
        }).save();

        await new ShippingTracking({
            order_id: order._id,
            status: "Đang giao hàng",
            location: "Kho Cần Thơ",
            description: "Đơn hàng đang được trung chuyển"
        }).save();

        console.log("✅ Seeding successful! Database matches new CDM.");
        process.exit();
    } catch (error) {
        console.error("❌ Error seeding data:", error);
        process.exit(1);
    }
}

seedData();
