import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./src/models/product.model.js";

dotenv.config();

// Sử dụng vnName (tên tiếng Việt) để mapping, vì thông thường hiển thị cho người Việt
const AI_DISEASES = {
    ECZEMA: "Chàm (Viêm da cơ địa)",
    WARTS: "Mụn cóc và u mềm lây",
    MELANOMA: "U hắc tố",
    ATOPIC: "Dị ứng da",
    BCC: "U tế bào đáy (BCC)",
    NEVI: "U nhú melanin (NV)",
    BKL: "U hạt sừng",
    PSORIASIS: "Vảy nến",
    SEBORRHEIC: "U hạt bã nhờn",
    TINEA: "Nấm da (Hắc lào)"
};

const aiProducts = [
    // 1. ECZEMA & ATOPIC (Viêm da cơ địa, dị ứng)
    {
        title: "Kem dưỡng ẩm phục hồi Bioderma Atoderm Intensive Baume",
        price: 490000,
        quantity: 100,
        expiry_date: "12/2026",
        usage: "Thoa 1-2 lần/ngày lên vùng da bị viêm, ngứa.",
        skin_type: ["Da khô", "Da nhạy cảm", "Da viêm"],
        pathology: [AI_DISEASES.ECZEMA, AI_DISEASES.ATOPIC],
        image: "https://example.com/bioderma.jpg",
        images: ["https://example.com/bioderma.jpg"],
        prescription_required: false,
    },
    {
        title: "Kem bôi Corticosteroid Hydrocortisone 1%",
        price: 150000,
        quantity: 50,
        expiry_date: "10/2026",
        usage: "Thoa một lớp mỏng lên vùng da viêm ngứa 1-2 lần/ngày.",
        skin_type: ["Da viêm"],
        pathology: [AI_DISEASES.ECZEMA, AI_DISEASES.ATOPIC, AI_DISEASES.PSORIASIS],
        image: "https://example.com/hydrocortisone.jpg",
        images: ["https://example.com/hydrocortisone.jpg"],
        prescription_required: true,
        warnings: "Không bôi liên tục quá 2 tuần nếu không có chỉ định bác sĩ.",
    },

    // 2. TINEA (Nấm da hắc lào)
    {
        title: "Kem bôi trị nấm Ketoconazole 2%",
        price: 85000,
        quantity: 200,
        expiry_date: "05/2027",
        usage: "Thoa lên vùng da nấm 1-2 lần/ngày. Tiếp tục dùng 2-3 ngày sau khi hết triệu chứng.",
        skin_type: ["Mọi loại da"],
        pathology: [AI_DISEASES.TINEA],
        image: "https://example.com/ketoconazole.jpg",
        images: ["https://example.com/ketoconazole.jpg"],
        prescription_required: false,
    },

    // 3. PSORIASIS (Vảy nến)
    {
        title: "Sữa tắm trị liệu Salicylic Acid 2% (BHA)",
        price: 320000,
        quantity: 80,
        expiry_date: "11/2026",
        usage: "Dùng để tắm gội, giúp loại bỏ vảy sừng.",
        skin_type: ["Da vảy nến", "Da mụn"],
        pathology: [AI_DISEASES.PSORIASIS, AI_DISEASES.BKL],
        image: "https://example.com/bha-wash.jpg",
        images: ["https://example.com/bha-wash.jpg"],
        prescription_required: false,
    },

    // 4. WARTS (Mụn cóc)
    {
        title: "Dung dịch chấm mụn cóc Acid Salicylic 20%",
        price: 120000,
        quantity: 150,
        expiry_date: "08/2027",
        usage: "Chấm trực tiếp lên nốt mụn cóc mỗi tối.",
        skin_type: ["Vùng da mụn cóc"],
        pathology: [AI_DISEASES.WARTS],
        image: "https://example.com/acid-salicylic-20.jpg",
        images: ["https://example.com/acid-salicylic-20.jpg"],
        prescription_required: false,
        warnings: "Tránh để dung dịch dây ra vùng da lành.",
    },

    // 5. UNG THƯ & U LÀNH TÍNH (Melanoma, BCC, Nevi, BKL, Seborrheic)
    {
        title: "Kem chống nắng phổ rộng SPF 50+ PA++++ (Phòng ngừa)",
        price: 550000,
        quantity: 300,
        expiry_date: "01/2028",
        usage: "Thoa mỗi ngày để bảo vệ da khỏi tia UV, phòng ngừa u ác tính và lão hóa.",
        skin_type: ["Mọi loại da"],
        pathology: [AI_DISEASES.MELANOMA, AI_DISEASES.BCC, AI_DISEASES.NEVI, AI_DISEASES.SEBORRHEIC, AI_DISEASES.BKL],
        image: "https://example.com/sunscreen.jpg",
        images: ["https://example.com/sunscreen.jpg"],
        prescription_required: false,
        notes: "U hắc tố và u tế bào đáy cần can thiệp y tế (Phẫu thuật, laser). Sản phẩm này chỉ giúp bảo vệ và phòng ngừa phát triển."
    }
];

const seedAIProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to MongoDB...");
        
        console.log("Seeding AI target products...");
        const inserted = await Product.insertMany(aiProducts);
        
        console.log(`Đã thêm thành công ${inserted.length} sản phẩm tương ứng với 10 lớp bệnh!`);
        process.exit();
    } catch (error) {
        console.error("Lỗi khi seed dữ liệu:", error);
        process.exit(1);
    }
};

seedAIProducts();
