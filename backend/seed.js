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
import Setting from "./src/models/setting.model.js";
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
            addresses: [{
                label: "Nhà riêng",
                address: "Ninh Kieu, Can Tho",
                phone: "0909000111",
                isDefault: true
            }]
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
        const brand7 = new Brand({ name: "Eucerin", address: "Germany" });
        const brand8 = new Brand({ name: "Bioderma", address: "France" });
        const brand9 = new Brand({ name: "Cetaphil", address: "USA" });
        await brand1.save();
        await brand2.save();
        await brand3.save();
        await brand4.save();
        await brand5.save();
        await brand6.save();
        await brand7.save();
        await brand8.save();
        await brand9.save();

        const supplier1 = new Supplier({ name: "Công ty L'Oréal VN", address: "Hồ Chí Minh", phone: "1800545463" });
        await supplier1.save();

        console.log("Inserting Promotions...");
        const promo1 = new Promotion({
            code: "WELCOME10",
            name: "Giảm 10% đơn đầu tiên",
            discount_type: "percentage",
            discount_value: 10,
            start_date: new Date(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            min_order_value: 500000,
            max_discount_amount: 100000,
            usage_limit: 100
        });
        const promo2 = new Promotion({
            code: "FREESHIP",
            name: "Miễn phí vận chuyển",
            discount_type: "fixed_amount",
            discount_value: 100,
            start_date: new Date("2024-01-01"),
            end_date: new Date("2024-12-31"),
            min_order_value: 300000,
            usage_limit: 500
        });
        await promo1.save();
        await promo2.save();

        console.log("Inserting Default Settings...");
        const settingsToSeed = [
            { khoa_cau_hinh: 'comment_type', gia_tri: 'system', mo_ta: 'Loại bình luận (system hoặc facebook)' },
            { khoa_cau_hinh: 'comment_on_product', gia_tri: 'true', mo_ta: 'Cho phép bình luận trên trang sản phẩm' },
            { khoa_cau_hinh: 'comment_on_post', gia_tri: 'true', mo_ta: 'Cho phép bình luận trên trang bài viết' },
            { khoa_cau_hinh: 'comment_require_approval', gia_tri: 'false', mo_ta: 'Bình luận hệ thống phải được kiểm duyệt' },
            { khoa_cau_hinh: 'comment_allow_rating', gia_tri: 'true', mo_ta: 'Cho phép đánh giá sao ở bình luận hệ thống' },
            { khoa_cau_hinh: 'fb_app_id', gia_tri: '', mo_ta: 'Facebook App ID cho Facebook Comments' },
        ];
        for (const s of settingsToSeed) {
            await new Setting(s).save();
        }

        console.log("Inserting Products (30 realistic dermatology products)...");

        const productsList = [
            {
                title: "La Roche-Posay Effaclar Purifying Foaming Gel",
                price: 385000, quantity: 150, expiry_date: "12/2026",
                brand_id: brand1._id, category_id: cat1._id,
                usage: "Làm sạch sâu bã nhờn, thông thoáng lỗ chân lông, ngăn mụn ẩn cho da dầu mụn.",
                skin_type: ["da dầu", "da mụn"], pathology: ["mụn"],
                image: "https://media.hasaki.vn/catalog/product/s/u/sua-rua-mat-la-roche-posay-dang-gel-khoi-tao-lan-da-khoe-manh-400ml-hasaki_1.jpg",
                images: ["https://media.hasaki.vn/catalog/product/s/u/sua-rua-mat-la-roche-posay-dang-gel-khoi-tao-lan-da-khoe-manh-400ml-hasaki_1.jpg"],
                prescription_required: false, origin_country: "Pháp"
            },
            {
                title: "CeraVe Foaming Facial Cleanser",
                price: 450000, quantity: 100, expiry_date: "05/2027",
                brand_id: brand2._id, category_id: cat1._id,
                usage: "Làm sạch bã nhờn dịu nhẹ, duy trì độ ẩm tự nhiên cho da thường đến da dầu.",
                skin_type: ["da dầu", "da thường", "da hỗn hợp"], pathology: ["bã nhờn"],
                image: "https://media.hasaki.vn/catalog/product/s/u/sua-rua-mat-cerave-phat-trien-boi-bac-si-da-lieu-khoi-tao-lan-da-khoe-manh-473ml-hasaki_1_1.jpg",
                images: ["https://media.hasaki.vn/catalog/product/s/u/sua-rua-mat-cerave-phat-trien-boi-bac-si-da-lieu-khoi-tao-lan-da-khoe-manh-473ml-hasaki_1_1.jpg"],
                prescription_required: false, origin_country: "Mỹ"
            },
            {
                title: "Bioderma Sensibio H2O Micellar Water",
                price: 420000, quantity: 120, expiry_date: "11/2026",
                brand_id: brand8._id, category_id: cat5._id,
                usage: "Nước tẩy trang dịu nhẹ nhất thế giới dành cho làn da nhạy cảm dễ kích ứng.",
                skin_type: ["da nhạy cảm", "mọi loại da"], pathology: ["kích ứng da"],
                image: "https://media.hasaki.vn/catalog/product/f/a/facebook-dynamic-nuoc-tay-trang-bioderma-danh-cho-da-nhay-cam-500ml-hasaki_1.jpg",
                images: ["https://media.hasaki.vn/catalog/product/f/a/facebook-dynamic-nuoc-tay-trang-bioderma-danh-cho-da-nhay-cam-500ml-hasaki_1.jpg"],
                prescription_required: false, origin_country: "Pháp"
            },
            {
                title: "CeraVe Moisturising Cream",
                price: 450000, quantity: 80, expiry_date: "08/2026",
                brand_id: brand2._id, category_id: cat2._id,
                usage: "Kem dưỡng ẩm chuyên sâu cho da khô đến rất khô, bổ sung 3 Ceramides thiết yếu.",
                skin_type: ["da khô", "da nhạy cảm"], pathology: ["khô da"],
                image: "https://media.hasaki.vn/catalog/product/k/e/kem-duong-am-cerave-danh-cho-da-kho-den-rat-kho-340g-hasaki_1_1.jpg",
                images: ["https://media.hasaki.vn/catalog/product/k/e/kem-duong-am-cerave-danh-cho-da-kho-den-rat-kho-340g-hasaki_1_1.jpg"],
                prescription_required: false, origin_country: "Mỹ"
            },
            {
                title: "La Roche-Posay Cicaplast Baume B5+",
                price: 325000, quantity: 200, expiry_date: "10/2026",
                brand_id: brand1._id, category_id: cat2._id,
                usage: "Kem dưỡng làm dịu, phục hồi hàng rào bảo vệ da sau 1 giờ sử dụng.",
                skin_type: ["da nhạy cảm", "da tổn thương"], pathology: ["mẩn đỏ", "kích ứng"],
                image: "https://media.hasaki.vn/catalog/product/k/e/kem-duong-la-roche-posay-lam-diu-kich-ung-phuc-hoi-da-40ml-b5-plus-hasaki_1.jpg",
                images: ["https://media.hasaki.vn/catalog/product/k/e/kem-duong-la-roche-posay-lam-diu-kich-ung-phuc-hoi-da-40ml-b5-plus-hasaki_1.jpg"],
                prescription_required: false, origin_country: "Pháp"
            },
            {
                title: "Obagi Professional-C Serum 20%",
                price: 2350000, quantity: 30, expiry_date: "09/2026",
                brand_id: brand3._id, category_id: cat3._id,
                usage: "Tinh chất Vitamin C 20% làm sáng da vượt trội, ngăn ngừa lão hóa toàn diện.",
                skin_type: ["da thường", "da hỗn hợp"], pathology: ["thâm sạm", "lão hóa"],
                image: "https://media.hasaki.vn/catalog/product/s/e/serum-obagi-professional-c-serum-20-chong-lao-hoa-lam-sang-da-30ml-hasaki_1_1.jpg",
                images: ["https://media.hasaki.vn/catalog/product/s/e/serum-obagi-professional-c-serum-20-chong-lao-hoa-lam-sang-da-30ml-hasaki_1_1.jpg"],
                prescription_required: true, origin_country: "Mỹ",
                contraindications: "Không bôi trực tiếp lên vết thương hở sâu hoặc mụn bọc đang viêm nặng."
            },
            {
                title: "Paula's Choice Skin Perfecting 2% BHA Liquid",
                price: 950000, quantity: 60, expiry_date: "03/2027",
                brand_id: brand5._id, category_id: cat3._id,
                usage: "Dung dịch loại bỏ tế bào chết hóa học 2% Salicylic Acid cải thiện mụn và lỗ chân lông.",
                skin_type: ["da dầu", "da hỗn hợp"], pathology: ["mụn ẩn", "mụn cám"],
                image: "https://media.hasaki.vn/catalog/product/d/u/dung-dich-paula-s-choice-loai-bo-te-bao-chet-2-bha-118ml-hasaki_1.jpg",
                images: ["https://media.hasaki.vn/catalog/product/d/u/dung-dich-paula-s-choice-loai-bo-te-bao-chet-2-bha-118ml-hasaki_1.jpg"],
                prescription_required: false, origin_country: "Mỹ"
            },
            {
                title: "Vichy Capital Soleil SPF50+ Anti-Dark Spots",
                price: 480000, quantity: 50, expiry_date: "04/2027",
                brand_id: brand4._id, category_id: cat4._id,
                usage: "Kem chống nắng giảm thâm sạm và bảo vệ da tối đa trước ánh nắng mặt trời.",
                skin_type: ["mọi loại da"], pathology: ["sạm da", "nắng rát"],
                image: "https://media.hasaki.vn/catalog/product/k/e/kem-chong-nang-vichy-chong-doc-hai-hang-ngay-50ml-hasaki_1_1.jpg",
                images: ["https://media.hasaki.vn/catalog/product/k/e/kem-chong-nang-vichy-chong-doc-hai-hang-ngay-50ml-hasaki_1_1.jpg"],
                prescription_required: false, origin_country: "Pháp"
            },
            {
                title: "The Ordinary Niacinamide 10% + Zinc 1%",
                price: 220000, quantity: 150, expiry_date: "02/2027",
                brand_id: brand6._id, category_id: cat3._id,
                usage: "Hỗ trợ giảm viêm mụn, mờ vết thâm, thu nhỏ lỗ chân lông hiệu quả.",
                skin_type: ["mọi loại da"], pathology: ["thâm mụn"],
                image: "https://media.hasaki.vn/catalog/product/t/i/tinh-chat-the-ordinary-niacinamide-10-zinc-1-ho-tro-giam-mun-va-tham-30ml-hasaki_1.jpg",
                images: ["https://media.hasaki.vn/catalog/product/t/i/tinh-chat-the-ordinary-niacinamide-10-zinc-1-ho-tro-giam-mun-va-tham-30ml-hasaki_1.jpg"],
                prescription_required: false, origin_country: "Canada"
            },
            {
                title: "The Ordinary Hyaluronic Acid 2% + B5",
                price: 260000, quantity: 90, expiry_date: "07/2026",
                brand_id: brand6._id, category_id: cat3._id,
                usage: "Tinh chất cấp nước đa tầng chuyên sâu và hỗ trợ phục hồi làn da bong tróc.",
                skin_type: ["da khô", "da nhạy cảm"], pathology: ["bong tróc", "khô da"],
                image: "https://media.hasaki.vn/catalog/product/s/e/serum-the-ordinary-cap-am-phuc-hoi-da-hyaluronic-acid-2-b5-30ml-hasaki_1.jpg",
                images: ["https://media.hasaki.vn/catalog/product/s/e/serum-the-ordinary-cap-am-phuc-hoi-da-hyaluronic-acid-2-b5-30ml-hasaki_1.jpg"],
                prescription_required: false, origin_country: "Canada"
            },
            {
                title: "Eucerin UreaRepair Plus 10% Urea",
                price: 450000, quantity: 40, expiry_date: "01/2027",
                brand_id: brand7._id, category_id: cat2._id,
                usage: "Kem dưỡng ẩm giảm ngứa, nứt nẻ và làm mềm làn da cực kỳ thô ráp, bong tróc.",
                skin_type: ["da cực khô", "da bong tróc"], pathology: ["nứt nẻ", "khô da"],
                image: "https://media.hasaki.vn/catalog/product/k/e/kem-duong-am-eucerin-cho-da-kho-ngua-nut-ne-450ml-hasaki_1.jpg",
                images: ["https://media.hasaki.vn/catalog/product/k/e/kem-duong-am-eucerin-cho-da-kho-ngua-nut-ne-450ml-hasaki_1.jpg"],
                prescription_required: false, origin_country: "Đức"
            },
            {
                title: "La Roche-Posay Anthelios UVMune 400 Oil Control",
                price: 475000, quantity: 110, expiry_date: "06/2027",
                brand_id: brand1._id, category_id: cat4._id,
                usage: "Kem chống nắng kiểm soát dầu thừa hiệu quả suốt 12 tiếng cùng màng lọc chống nắng tối tân.",
                skin_type: ["da dầu", "da hỗn hợp"], pathology: ["bóng nhờn"],
                image: "https://media.hasaki.vn/catalog/product/f/a/facebook-dynamic-kem-chong-nang-la-roche-posay-kiem-soat-dau-spf50-50ml-uvmune-400-hasaki_1.jpg",
                images: ["https://media.hasaki.vn/catalog/product/f/a/facebook-dynamic-kem-chong-nang-la-roche-posay-kiem-soat-dau-spf50-50ml-uvmune-400-hasaki_1.jpg"],
                prescription_required: false, origin_country: "Pháp"
            },
            {
                title: "Vichy Normaderm Phytosolution Gel Cleanser",
                price: 420000, quantity: 60, expiry_date: "11/2026",
                brand_id: brand4._id, category_id: cat1._id,
                usage: "Gel rửa mặt làm sạch sâu, se khít lỗ chân lông, kiềm dầu tối ưu cho da dầu mụn.",
                skin_type: ["da dầu", "da mụn"], pathology: ["mụn viêm"],
                image: "https://media.hasaki.vn/catalog/product/s/u/sua-rua-mat-vichy-dang-gel-ngan-ngua-mun-400ml-hasaki_1_1.jpg",
                images: ["https://media.hasaki.vn/catalog/product/s/u/sua-rua-mat-vichy-dang-gel-ngan-ngua-mun-400ml-hasaki_1_1.jpg"],
                prescription_required: false, origin_country: "Pháp"
            },
            {
                title: "Paula's Choice Clinical 1% Retinol Treatment",
                price: 1450000, quantity: 25, expiry_date: "09/2026",
                brand_id: brand5._id, category_id: cat3._id,
                usage: "Tinh chất Retinol 1% chuyên sâu cải thiện nếp nhăn và phục hồi làn da lão hóa.",
                skin_type: ["da lão hóa", "da thường"], pathology: ["nếp nhăn", "lão hóa"],
                image: "https://media.hasaki.vn/catalog/product/t/i/tinh-chat-paula-s-choice-ngan-ngua-lao-hoa-retinol-1-30ml-hasaki_1.jpg",
                images: ["https://media.hasaki.vn/catalog/product/t/i/tinh-chat-paula-s-choice-ngan-ngua-lao-hoa-retinol-1-30ml-hasaki_1.jpg"],
                prescription_required: true, origin_country: "Mỹ"
            },
            {
                title: "Obagi Clinical Kinetin+ Hydrating Cream",
                price: 1350000, quantity: 45, expiry_date: "08/2027",
                brand_id: brand3._id, category_id: cat2._id,
                usage: "Kem dưỡng phục hồi sâu dành riêng cho làn da nhạy cảm mẩn đỏ và yếu.",
                skin_type: ["da nhạy cảm", "da yếu"], pathology: ["mẩn đỏ", "kích ứng"],
                image: "https://media.hasaki.vn/catalog/product/f/a/facebook-dynamic-kem-duong-phuc-hoi-da-obagi-kinetin-hydrating-cream-50ml-hasaki_1.jpg",
                images: ["https://media.hasaki.vn/catalog/product/f/a/facebook-dynamic-kem-duong-phuc-hoi-da-obagi-kinetin-hydrating-cream-50ml-hasaki_1.jpg"],
                prescription_required: false, origin_country: "Mỹ"
            },
            {
                title: "Cetaphil Gentle Skin Cleanser",
                price: 390000, quantity: 180, expiry_date: "07/2027",
                brand_id: brand9._id, category_id: cat1._id,
                usage: "Sữa rửa mặt làm sạch dịu nhẹ không tạo bọt, thích hợp cho cả làn da em bé.",
                skin_type: ["da nhạy cảm", "da khô", "mọi loại da"], pathology: ["mụn nhẹ"],
                image: "https://media.hasaki.vn/catalog/product/s/u/sua-rua-mat-cetaphil-diu-nhe-khong-tao-bot-500ml-hasaki_1_1.jpg",
                images: ["https://media.hasaki.vn/catalog/product/s/u/sua-rua-mat-cetaphil-diu-nhe-khong-tao-bot-500ml-hasaki_1_1.jpg"],
                prescription_required: false, origin_country: "Mỹ"
            },
            {
                title: "CeraVe Hydrating Cleanser",
                price: 390000, quantity: 110, expiry_date: "12/2026",
                brand_id: brand2._id, category_id: cat1._id,
                usage: "Sữa rửa mặt cấp ẩm sâu cho da khô nhạy cảm, giúp cân bằng lại lớp màng bảo vệ.",
                skin_type: ["da khô", "da nhạy cảm"], pathology: ["khô ráp"],
                image: "https://media.hasaki.vn/catalog/product/s/u/sua-rua-mat-cerave-phat-trien-boi-bac-si-da-lieu-lam-sach-nhe-nhang-473ml-hasaki_1_1.jpg",
                images: ["https://media.hasaki.vn/catalog/product/s/u/sua-rua-mat-cerave-phat-trien-boi-bac-si-da-lieu-lam-sach-nhe-nhang-473ml-hasaki_1_1.jpg"],
                prescription_required: false, origin_country: "Mỹ"
            },
            {
                title: "Bioderma Sebium H2O Micellar Water",
                price: 420000, quantity: 80, expiry_date: "11/2027",
                brand_id: brand8._id, category_id: cat5._id,
                usage: "Nước tẩy trang kiềm dầu, giảm mụn chuyên sâu cho da dầu mụn và hỗn hợp thiên dầu.",
                skin_type: ["da dầu", "da mụn"], pathology: ["bóng dầu", "mụn ẩn"],
                image: "https://media.hasaki.vn/catalog/product/f/a/facebook-dynamic-nuoc-tay-trang-bioderma-danh-cho-da-dau-va-hon-hop-500ml-hasaki_1.jpg",
                images: ["https://media.hasaki.vn/catalog/product/f/a/facebook-dynamic-nuoc-tay-trang-bioderma-danh-cho-da-dau-va-hon-hop-500ml-hasaki_1.jpg"],
                prescription_required: false, origin_country: "Pháp"
            },
            {
                title: "La Roche-Posay Effaclar Duo(+) Acne Treatment",
                price: 425000, quantity: 70, expiry_date: "08/2027",
                brand_id: brand1._id, category_id: cat2._id,
                usage: "Kem dưỡng trị mụn ngừa thâm vượt trội, kháng viêm và gom cồi mụn thần tốc.",
                skin_type: ["da mụn", "da dầu"], pathology: ["mụn bọc", "thâm mụn"],
                image: "https://media.hasaki.vn/catalog/product/f/a/facebook-dynamic-kem-duong-la-roche-posay-giam-mun-ngua-tham-40ml-effaclar-duo-hasaki_1.jpg",
                images: ["https://media.hasaki.vn/catalog/product/f/a/facebook-dynamic-kem-duong-la-roche-posay-giam-mun-ngua-tham-40ml-effaclar-duo-hasaki_1.jpg"],
                prescription_required: true, origin_country: "Pháp"
            },
            {
                title: "Paula's Choice Clear Ultra-Light Daily Fluid SPF30",
                price: 950000, quantity: 40, expiry_date: "07/2027",
                brand_id: brand5._id, category_id: cat4._id,
                usage: "Kem chống nắng siêu nhẹ kiềm dầu tối đa dành riêng cho làn da dễ bùng phát mụn.",
                skin_type: ["da dầu", "da mụn"], pathology: ["mụn trứng cá"],
                image: "https://media.hasaki.vn/catalog/product/k/e/kem-chong-nang-paula-s-choice-sieu-nhe-kiem-dau-spf-50-60ml-hasaki_1.jpg",
                images: ["https://media.hasaki.vn/catalog/product/k/e/kem-chong-nang-paula-s-choice-sieu-nhe-kiem-dau-spf-50-60ml-hasaki_1.jpg"],
                prescription_required: false, origin_country: "Mỹ"
            },
            {
                title: "Eucerin ProAcne Cleansing Gel",
                price: 345000, quantity: 95, expiry_date: "01/2027",
                brand_id: brand7._id, category_id: cat1._id,
                usage: "Gel rửa mặt kháng khuẩn sâu, không chứa xà phòng, cực kỳ êm dịu cho da mụn.",
                skin_type: ["da mụn", "da nhạy cảm"], pathology: ["mụn sưng đỏ"],
                image: "https://media.hasaki.vn/catalog/product/g/e/gel-rua-mat-eucerin-cho-da-mun-200ml-hasaki_1_1.jpg",
                images: ["https://media.hasaki.vn/catalog/product/g/e/gel-rua-mat-eucerin-cho-da-mun-200ml-hasaki_1_1.jpg"],
                prescription_required: false, origin_country: "Đức"
            },
            {
                title: "The Ordinary Glycolic Acid 7% Toning Solution",
                price: 390000, quantity: 130, expiry_date: "04/2027",
                brand_id: brand6._id, category_id: cat5._id,
                usage: "Toner tẩy tế bào chết AHA 7% làm mịn cấu trúc da và giảm vết thâm sạm tối màu.",
                skin_type: ["da thường", "da dầu", "da hỗn hợp"], pathology: ["thâm sạm", "da sần sùi"],
                image: "https://media.hasaki.vn/catalog/product/n/u/nuoc-hoa-hong-the-ordinary-tay-te-bao-chet-7-glycolic-acid-240ml-hasaki_1.jpg",
                images: ["https://media.hasaki.vn/catalog/product/n/u/nuoc-hoa-hong-the-ordinary-tay-te-bao-chet-7-glycolic-acid-240ml-hasaki_1.jpg"],
                prescription_required: false, origin_country: "Canada"
            },
            {
                title: "Vichy Mineral 89 Booster Serum",
                price: 620000, quantity: 75, expiry_date: "11/2026",
                brand_id: brand4._id, category_id: cat3._id,
                usage: "Dưỡng chất cô đặc giúp phục hồi làn da xỉn màu và củng cố hàng rào bảo vệ tự nhiên.",
                skin_type: ["mọi loại da", "da yếu"], pathology: ["xỉn màu", "mất nước"],
                image: "https://media.hasaki.vn/catalog/product/f/a/facebook-dynamic-duong-chat-vichy-khoang-phuc-hoi-va-bao-ve-da-50ml-hasaki_1.jpg",
                images: ["https://media.hasaki.vn/catalog/product/f/a/facebook-dynamic-duong-chat-vichy-khoang-phuc-hoi-va-bao-ve-da-50ml-hasaki_1.jpg"],
                prescription_required: false, origin_country: "Pháp"
            },
            {
                title: "Obagi Nu-Derm Blend Fx Cream",
                price: 2100000, quantity: 20, expiry_date: "02/2027",
                brand_id: brand3._id, category_id: cat2._id,
                usage: "Kem dưỡng ẩm và phục hồi chuyên sâu, làm mờ nám sạm và đốm nâu không chứa hydroquinone.",
                skin_type: ["da sạm nám", "mọi loại da"], pathology: ["nám", "tàn nhang"],
                image: "https://media.hasaki.vn/catalog/product/f/a/facebook-dynamic-kem-duong-obagi-lam-sang-da-ngua-lao-hoa-nu-derm-blend-fx-57g-hasaki_1.jpg",
                images: ["https://media.hasaki.vn/catalog/product/f/a/facebook-dynamic-kem-duong-obagi-lam-sang-da-ngua-lao-hoa-nu-derm-blend-fx-57g-hasaki_1.jpg"],
                prescription_required: true, origin_country: "Mỹ"
            },
            {
                title: "Bioderma Atoderm Intensive Baume",
                price: 490000, quantity: 85, expiry_date: "09/2027",
                brand_id: brand8._id, category_id: cat2._id,
                usage: "Kem dưỡng phục hồi ngứa ngáy, làm dịu viêm da cơ địa dị ứng.",
                skin_type: ["da cực khô", "da viêm cơ địa"], pathology: ["khô da nặng", "ngứa rát"],
                image: "https://media.hasaki.vn/catalog/product/k/e/kem-duong-bioderma-lam-diu-va-giam-ngua-cho-da-kho-45ml-hasaki_1_1.jpg",
                images: ["https://media.hasaki.vn/catalog/product/k/e/kem-duong-bioderma-lam-diu-va-giam-ngua-cho-da-kho-45ml-hasaki_1_1.jpg"],
                prescription_required: false, origin_country: "Pháp"
            },
            {
                title: "CeraVe PM Facial Moisturizing Lotion",
                price: 370000, quantity: 140, expiry_date: "12/2026",
                brand_id: brand2._id, category_id: cat2._id,
                usage: "Lotion dưỡng ẩm dịu nhẹ ban đêm, phục hồi da sạm, giảm thiểu đỏ kích ứng.",
                skin_type: ["da thường", "da nhạy cảm"], pathology: ["kích ứng nhẹ"],
                image: "https://media.hasaki.vn/catalog/product/f/a/facebook-dynamic-kem-duong-am-cerave-ban-dem-cho-da-thuong-den-kho-52ml-hasaki_1.jpg",
                images: ["https://media.hasaki.vn/catalog/product/f/a/facebook-dynamic-kem-duong-am-cerave-ban-dem-cho-da-thuong-den-kho-52ml-hasaki_1.jpg"],
                prescription_required: false, origin_country: "Mỹ"
            },
            {
                title: "Eucerin Sun Protection Double Whitening SPF50+",
                price: 520000, quantity: 65, expiry_date: "05/2027",
                brand_id: brand7._id, category_id: cat4._id,
                usage: "Serum chống nắng kép kết hợp Thiamidol làm sáng da và ngừa đốm sắc tố tái phát.",
                skin_type: ["da xỉn màu", "mọi loại da"], pathology: ["nám", "đốm nâu"],
                image: "https://media.hasaki.vn/catalog/product/k/e/kem-chong-nang-eucerin-duong-sang-da-giam-tham-50ml-hasaki_1.jpg",
                images: ["https://media.hasaki.vn/catalog/product/k/e/kem-chong-nang-eucerin-duong-sang-da-giam-tham-50ml-hasaki_1.jpg"],
                prescription_required: false, origin_country: "Đức"
            },
            {
                title: "La Roche-Posay Pure Vitamin C10 Serum",
                price: 980000, quantity: 45, expiry_date: "03/2027",
                brand_id: brand1._id, category_id: cat3._id,
                usage: "Tinh chất Vitamin C tinh khiết 10% kết hợp Salicylic Acid làm sáng và mịn da rõ rệt.",
                skin_type: ["da nhạy cảm", "da xỉn màu"], pathology: ["thâm sạm", "lão hóa da"],
                image: "https://media.hasaki.vn/catalog/product/s/e/serum-la-roche-posay-ngan-ngua-lao-hoa-lam-sang-da-pure-vitamin-c10-30ml-hasaki_1.jpg",
                images: ["https://media.hasaki.vn/catalog/product/s/e/serum-la-roche-posay-ngan-ngua-lao-hoa-lam-sang-da-pure-vitamin-c10-30ml-hasaki_1.jpg"],
                prescription_required: false, origin_country: "Pháp"
            },
            {
                title: "Paula's Choice C15 Super Booster",
                price: 1350000, quantity: 35, expiry_date: "02/2027",
                brand_id: brand5._id, category_id: cat3._id,
                usage: "Booster Vitamin C 15% tăng cường dưỡng sáng vượt trội, đẩy lùi thâm xỉn màu.",
                skin_type: ["mọi loại da"], pathology: ["thâm sạm", "lỗ chân lông to"],
                image: "https://media.hasaki.vn/catalog/product/t/i/tinh-chat-paula-s-choice-lam-sang-da-va-ngan-lao-hoa-vitamin-c-20ml-hasaki_1.jpg",
                images: ["https://media.hasaki.vn/catalog/product/t/i/tinh-chat-paula-s-choice-lam-sang-da-va-ngan-lao-hoa-vitamin-c-20ml-hasaki_1.jpg"],
                prescription_required: false, origin_country: "Mỹ"
            },
            {
                title: "The Ordinary Squalane Cleanser",
                price: 320000, quantity: 90, expiry_date: "06/2027",
                brand_id: brand6._id, category_id: cat1._id,
                usage: "Sữa rửa mặt kiêm tẩy trang dịu nhẹ chứa dầu Squalane thuần chay bảo vệ độ ẩm mịn.",
                skin_type: ["da khô", "da nhạy cảm", "mọi loại da"], pathology: ["khô căng da"],
                image: "https://media.hasaki.vn/catalog/product/s/u/sua-rua-mat-the-ordinary-tay-trang-diu-nhe-squalane-cleanser-50ml-hasaki_1.jpg",
                images: ["https://media.hasaki.vn/catalog/product/s/u/sua-rua-mat-the-ordinary-tay-trang-diu-nhe-squalane-cleanser-50ml-hasaki_1.jpg"],
                prescription_required: false, origin_country: "Canada"
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
            shipping_address: user1.addresses[0].address,
            phone_number: user1.addresses[0].phone,
            status: "shipping",
            carrier_name: "Giao Hàng Nhanh",
            tracking_number: "GHN123456789",
            subtotal: p1.price + p2.price,
            discount_amount: (p1.price + p2.price) * 0.1,
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

        console.log("✅ Seeding successful!");
        process.exit();
    } catch (error) {
        console.error("❌ Error seeding data:", error);
        process.exit(1);
    }
}

seedData();
