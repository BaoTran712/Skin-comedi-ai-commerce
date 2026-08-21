import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./src/models/product.model.js";
import Ingredient from "./src/models/ingredient.model.js";
import DiseaseProductMapping from "./src/models/diseaseProductMapping.model.js";
import DiseaseIngredient from "./src/models/diseaseIngredient.model.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/testskin";

const seedDatabase = async () => {
    try {
        console.log("Connecting to MongoDB:", MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log("MongoDB Connected!");

        // Clear existing collections
        await Product.deleteMany({});
        await Ingredient.deleteMany({});
        await DiseaseProductMapping.deleteMany({});
        await DiseaseIngredient.deleteMany({});
        console.log("Cleared old AI Recommendation data.");

        // ==========================================
        // 1. SEED INGREDIENTS
        // ==========================================
        const ingredientsData = [
            {
                name: "Salicylic Acid",
                description: "Beta Hydroxy Acid (BHA) tan trong dầu, thâm nhập sâu vào lỗ chân lông bạt sừng và làm sạch bã nhờn.",
                benefits: ["Bạt sừng", "Kháng viêm", "Làm sạch lỗ chân lông", "Giảm mụn ẩn"],
                mechanism: "Hòa tan lớp keo liên kết tế bào sừng cỗi, tẩy tế bào chết sâu trong cổ nang lông.",
                recommended_for: ["Acne", "Seborrheic Dermatitis", "Psoriasis", "Warts"],
                avoid_for: ["Open Wounds", "Severe Eczema Flare"],
                compatible_with: ["Niacinamide", "Hyaluronic Acid", "B5"],
                not_compatible_with: ["Retinol high dose", "Vitamin C LAA"],
            },
            {
                name: "Niacinamide",
                description: "Vitamin B3 đa năng làm dịu viêm, giảm tiết dầu, kích thích tổng hợp Ceramide và làm sáng da.",
                benefits: ["Củng cố hàng rào da", "Kiểm soát bã nhờn", "Mờ thâm PIE/PIH", "Kháng viêm"],
                mechanism: "Ngăn chặn sự di chuyển của hạt hắc tố melanosome và kích thích sản sinh lipid thượng bì.",
                recommended_for: ["Acne", "Rosacea", "Atopic Dermatitis", "Vitiligo"],
                avoid_for: [],
                compatible_with: ["Salicylic Acid", "Zinc PCA", "Ceramides", "B5"],
                not_compatible_with: [],
            },
            {
                name: "Azelaic Acid",
                description: "Hoạt chất kháng viêm chuẩn y khoa, tiêu diệt vi khuẩn C. acnes và kìm hãm sắc tố.",
                benefits: ["Giảm đỏ hồng ban", "Kháng viêm Rosacea", "Giảm sẩn mủ", "Mờ thâm"],
                mechanism: "Ức chế enzyme Tyrosinase và giảm giải phóng các cytokine viêm qua trung gian kallikrein-5.",
                recommended_for: ["Rosacea", "Acne", "Hyperpigmentation"],
                avoid_for: ["Extremely sensitive broken skin"],
                compatible_with: ["Niacinamide", "Metronidazole", "Centella"],
                not_compatible_with: ["AHA high dose"],
            },
            {
                name: "Ceramides",
                description: "Lipid thiết yếu chiếm 50% cấu trúc gian bào sừng, vá lại hàng rào bảo vệ da lỏng lẻo.",
                benefits: ["Khóa ẩm tuyệt đối", "Tái tạo hàng rào da", "Giảm bong tróc", "Giảm châm chích"],
                mechanism: "Liên kết các tế bào sừng sần sùi lại với nhau như vữa trát gạch, chống mất nước qua biểu bì.",
                recommended_for: ["Eczema", "Atopic Dermatitis", "Psoriasis", "Rosacea", "Vitiligo"],
                avoid_for: [],
                compatible_with: ["Hyaluronic Acid", "Panthenol", "Urea", "Colloidal Oatmeal"],
                not_compatible_with: [],
            },
            {
                name: "Urea",
                description: "Yếu tố dưỡng ẩm tự nhiên (NMF) siêu cấp nước và bạt sừng dày cộm ở nồng độ cao.",
                benefits: ["Tiêu vảy sừng", "Siêu dưỡng ẩm", "Làm mềm mảng vảy nến", "Giảm thô ráp"],
                mechanism: "Bẻ gãy liên kết hydro của protein sừng, kéo nước từ hạ bì lên thượng bì.",
                recommended_for: ["Psoriasis", "Eczema", "Seborrheic Keratoses"],
                avoid_for: ["Vết thương nứt rớm máu"],
                compatible_with: ["Ceramides", "Salicylic Acid", "Lactic Acid"],
                not_compatible_with: [],
            },
            {
                name: "Colloidal Oatmeal",
                description: "Bột yến mạch dạng keo được FDA công nhận là chất bảo vệ da và cắt cơn ngứa.",
                benefits: ["Cắt cơn ngứa tức thì", "Làm dịu da đỏ", "Giảm viêm", "Bảo vệ màng ẩm"],
                mechanism: "Chứa avenanthramides ức chế giải phóng histamine và cytokine gây viêm.",
                recommended_for: ["Eczema", "Atopic Dermatitis", "Chickenpox"],
                avoid_for: [],
                compatible_with: ["Ceramides", "Panthenol", "Petroleum Jelly"],
                not_compatible_with: [],
            },
        ];

        const insertedIngredients = await Ingredient.insertMany(ingredientsData);
        console.log(`Seeded ${insertedIngredients.length} Ingredients.`);

        // ==========================================
        // 2. SEED PRODUCTS
        // ==========================================
        const productsData = [
            {
                title: "Paula's Choice Skin Perfecting 2% BHA Liquid Exfoliant",
                name: "Paula's Choice 2% BHA Liquid Exfoliant",
                slug: "paulas-choice-2-bha-liquid-exfoliant",
                price: 949000,
                quantity: 50,
                brand: "Paula's Choice",
                category: "Serum / Tẩy tế bào chết",
                description: "Dung dịch bạt sừng chứa 2% Salicylic Acid tẩy tế bào chết sâu trong lỗ chân lông, làm sạch mụn ẩn, mụn đầu đen.",
                image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80",
                main_ingredients: ["Salicylic Acid 2%", "Camellia Oleifera (Trà xanh)"],
                ingredient_tags: ["Salicylic Acid", "BHA", "Trà xanh"],
                skin_type_tags: ["Da dầu", "Da hỗn hợp", "Da mụn"],
                skin_conditions_supported: ["Acne", "Seborrheic Dermatitis", "Warts"],
                skin_conditions_not_supported: ["Eczema Flare", "Open Wounds"],
                usage: "Bôi sau bước rửa mặt và toner. Dùng 1-2 lần/ngày.",
                morning_use: false,
                night_use: true,
                requires_sunscreen: true,
                usage_steps: "Bước 3: Sau bước rửa mặt và toner",
                usage_frequency: "1 lần / ngày vào buổi tối",
                pregnancy_safe: true,
                children_safe: false,
                recommended_age: "16+",
                contraindications: "Không dùng cho người dị ứng với Salicylate/Aspirin.",
                medical_warning: "Cần bôi kem chống nắng kỹ vào ban ngày.",
                compatible_ingredients: ["Niacinamide", "B5", "Hyaluronic Acid"],
                incompatible_ingredients: ["Retinol high dose", "Vitamin C LAA"],
                benefits: ["Gom cồi mụn", "Làm sạch lỗ chân lông", "Mờ thâm mụn"],
                oil_free: true,
                fragrance_free: true,
                alcohol_free: true,
                paraben_free: true,
                comedogenic_level: 0,
                texture: "Liquid",
                product_type: "Treatment",
                ai_priority_score: 95,
                ai_recommendation_reason: "Dung dịch chứa 2% BHA chuẩn y khoa giúp bạt sừng và làm sạch cồi mụn trứng cá vượt trội.",
            },
            {
                title: "CeraVe Moisturizing Cream for Normal to Dry Skin",
                name: "CeraVe Moisturizing Cream",
                slug: "cerave-moisturizing-cream",
                price: 450000,
                quantity: 100,
                brand: "CeraVe",
                category: "Kem dưỡng ẩm",
                description: "Kem dưỡng ẩm chuyên sâu chứa 3 loại Ceramide thiết yếu (1, 3, 6-II) và Hyaluronic Acid phục hồi hàng rào bảo vệ da.",
                image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80",
                main_ingredients: ["Ceramide NP", "Ceramide AP", "Ceramide EOP", "Hyaluronic Acid"],
                ingredient_tags: ["Ceramides", "Hyaluronic Acid", "Glycerin"],
                skin_type_tags: ["Da khô", "Da nhạy cảm", "Da bị tổn thương"],
                skin_conditions_supported: ["Eczema", "Atopic Dermatitis", "Psoriasis", "Rosacea", "Vitiligo"],
                skin_conditions_not_supported: [],
                usage: "Bôi toàn thân và mặt 2-3 lần/ngày.",
                morning_use: true,
                night_use: true,
                requires_sunscreen: false,
                usage_steps: "Bước 4: Bước dưỡng ẩm khóa nước",
                usage_frequency: "2-3 lần / ngày",
                pregnancy_safe: true,
                children_safe: true,
                recommended_age: "Mọi lứa tuổi",
                contraindications: "",
                medical_warning: "",
                compatible_ingredients: ["Tất cả các hoạt chất"],
                incompatible_ingredients: [],
                benefits: ["Khóa ẩm 24h", "Tái tạo hàng rào da", "Giảm châm chích đỏ rát"],
                oil_free: false,
                fragrance_free: true,
                alcohol_free: true,
                paraben_free: true,
                comedogenic_level: 0,
                texture: "Cream",
                product_type: "Moisturizer",
                ai_priority_score: 98,
                ai_recommendation_reason: "Chứa tỷ lệ chuẩn 3 loại Ceramide thiết yếu phục hồi hàng rào bảo vệ da cho bệnh nhân Chàm và Viêm da cơ địa.",
            },
            {
                title: "La Roche-Posay Cicaplast Baume B5+ Ultra-Repairing Soothing Balm",
                name: "La Roche-Posay Cicaplast Baume B5+",
                slug: "la-roche-posay-cicaplast-baume-b5-plus",
                price: 395000,
                quantity: 80,
                brand: "La Roche-Posay",
                category: "Kem phục hồi",
                description: "Kem dưỡng phục hồi làm dịu da chứa 5% Panthenol (B5), Madecassoside và nước khoáng La Roche-Posay.",
                image: "https://images.unsplash.com/photo-1608248597263-0057e192c527?auto=format&fit=crop&w=600&q=80",
                main_ingredients: ["Panthenol 5%", "Madecassoside", "Tribioma", "Bơ hạt mỡ"],
                ingredient_tags: ["Panthenol", "B5", "Centella", "Shea Butter"],
                skin_type_tags: ["Da nhạy cảm", "Da yếu tổn thương", "Da khô"],
                skin_conditions_supported: ["Rosacea", "Eczema", "Atopic Dermatitis", "Tinea", "Chickenpox"],
                skin_conditions_not_supported: ["Mụn trứng cá da siêu dầu"],
                usage: "Bôi lên vùng da cần phục hồi 2 lần/ngày.",
                morning_use: true,
                night_use: true,
                requires_sunscreen: false,
                usage_steps: "Bước 4: Thoa kem dưỡng làm dịu",
                usage_frequency: "2 lần / ngày",
                pregnancy_safe: true,
                children_safe: true,
                recommended_age: "Trẻ sơ sinh từ 3 tháng trở lên",
                contraindications: "",
                medical_warning: "",
                compatible_ingredients: ["Azelaic Acid", "Retinol", "AHA", "BHA"],
                incompatible_ingredients: [],
                benefits: ["Xoa dịu kích ứng", "Tăng tốc lành vết thương", "Giảm đỏ da"],
                oil_free: false,
                fragrance_free: true,
                alcohol_free: true,
                paraben_free: true,
                comedogenic_level: 1,
                texture: "Balm",
                product_type: "Moisturizer",
                ai_priority_score: 92,
                ai_recommendation_reason: "Nồng độ 5% Panthenol kết hợp Rau má xoa dịu tức thì cảm giác nóng rát cho da Rosacea và da chàm.",
            },
            {
                title: "Dermagor Skin Plast Azelaic Acid 15% Soothing Gel",
                name: "Dermagor Azelaic Acid 15% Gel",
                slug: "dermagor-azelaic-acid-15-gel",
                price: 520000,
                quantity: 40,
                brand: "Dermagor",
                category: "Gel đặc trị",
                description: "Gel đặc trị sẩn mủ và đỏ mặt với 15% Azelaic Acid y khoa kháng viêm và kháng vi khuẩn.",
                image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80",
                main_ingredients: ["Azelaic Acid 15%", "Glycerin"],
                ingredient_tags: ["Azelaic Acid"],
                skin_type_tags: ["Da đỏ Rosacea", "Da mụn nhạy cảm"],
                skin_conditions_supported: ["Rosacea", "Acne", "Hyperpigmentation"],
                skin_conditions_not_supported: [],
                usage: "Bôi một lớp mỏng lên vùng da đỏ rát 1-2 lần/ngày.",
                morning_use: true,
                night_use: true,
                requires_sunscreen: true,
                usage_steps: "Bước 3: Sau bước làm sạch và trước kem dưỡng",
                usage_frequency: "1-2 lần / ngày",
                pregnancy_safe: true,
                children_safe: false,
                recommended_age: "12+",
                contraindications: "Có thể châm chích nhẹ trong 1 tuần đầu.",
                medical_warning: "Nếu rát nhiều hãy lót một lớp kem dưỡng lót bên dưới.",
                compatible_ingredients: ["Niacinamide", "B5", "Ceramides"],
                incompatible_ingredients: ["AHA high dose"],
                benefits: ["Giảm sẩn mủ Rosacea", "Giảm đỏ da", "Mờ thâm mụn"],
                oil_free: true,
                fragrance_free: true,
                alcohol_free: true,
                paraben_free: true,
                comedogenic_level: 0,
                texture: "Gel",
                product_type: "Treatment",
                ai_priority_score: 96,
                ai_recommendation_reason: "Azelaic Acid 15% là tiêu chuẩn vàng y khoa thế giới giúp dập tắt sẩn mủ và đỏ hồng ban Rosacea.",
            },
            {
                title: "Eucerin Roughness Relief Lotion 10% Urea",
                name: "Eucerin Roughness Relief 10% Urea",
                slug: "eucerin-roughness-relief-10-urea",
                price: 480000,
                quantity: 60,
                brand: "Eucerin",
                category: "Kem bạt sừng dưỡng thể",
                description: "Sữa dưỡng thể bạt sừng và làm mềm mảng vảy nến thô ráp chứa 10% Urea và Ceramide 3.",
                image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80",
                main_ingredients: ["Urea 10%", "Ceramide NP", "Helianthus Annuus Seed Oil"],
                ingredient_tags: ["Urea", "Ceramides"],
                skin_type_tags: ["Da cực khô", "Da vảy nến", "Da sần sùi"],
                skin_conditions_supported: ["Psoriasis", "Eczema", "Seborrheic Keratoses"],
                skin_conditions_not_supported: ["Vết thương hở rớm máu"],
                usage: "Bôi lên vùng da thân mình/tay chân bị vảy sừng 1-2 lần/ngày.",
                morning_use: true,
                night_use: true,
                requires_sunscreen: false,
                usage_steps: "Thoa đều lên vùng da vảy sừng sau khi tắm",
                usage_frequency: "1-2 lần / ngày",
                pregnancy_safe: true,
                children_safe: false,
                recommended_age: "12+",
                contraindications: "Không bôi lên vết thương hở rớm máu.",
                medical_warning: "Có thể gây xót nếu da đang nứt rỉ máu.",
                compatible_ingredients: ["Salicylic Acid", "Ceramides"],
                incompatible_ingredients: [],
                benefits: ["Bạt sừng mảng vảy nến", "Làm mềm da thô ráp", "Dưỡng ẩm 48h"],
                oil_free: false,
                fragrance_free: true,
                alcohol_free: true,
                paraben_free: true,
                comedogenic_level: 0,
                texture: "Lotion",
                product_type: "Moisturizer",
                ai_priority_score: 94,
                ai_recommendation_reason: "Nồng độ 10% Urea phá vỡ lớp vỏ sừng cỗi của Vảy nến và củng cố hàng rào lipid da.",
            },
            {
                title: "La Roche-Posay Anthelios Dry Touch Finish Sunscreen SPF50+",
                name: "La Roche-Posay Anthelios SPF50+ Dry Touch",
                slug: "la-roche-posay-anthelios-dry-touch-spf50",
                price: 525000,
                quantity: 90,
                brand: "La Roche-Posay",
                category: "Kem chống nắng",
                description: "Kem chống nắng kiểm soát bóng dầu, không gây bít tắc lỗ chân lông với màng lọc XL-Protect chống UV phổ rộng.",
                image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80",
                main_ingredients: ["XL-Protect", "Airlicium", "Zinc PCA"],
                ingredient_tags: ["Zinc", "Sunscreen", "Airlicium"],
                skin_type_tags: ["Da dầu", "Da mụn", "Da hỗn hợp"],
                skin_conditions_supported: ["Acne", "Rosacea", "Actinic Keratosis", "Melanocytic Nevi"],
                skin_conditions_not_supported: [],
                usage: "Bôi trước khi ra nắng 20 phút. Bôi lại sau 2-3 tiếng.",
                morning_use: true,
                night_use: false,
                requires_sunscreen: false,
                usage_steps: "Bước cuối cùng ban ngày",
                usage_frequency: "Mỗi 2-3 tiếng ban ngày",
                pregnancy_safe: true,
                children_safe: false,
                recommended_age: "12+",
                contraindications: "",
                medical_warning: "",
                compatible_ingredients: ["Tất cả serum"],
                incompatible_ingredients: [],
                benefits: ["Bảo vệ khỏi UV", "Kiểm soát dầu 9h", "Không nâng tone bóng nhờn"],
                oil_free: true,
                fragrance_free: true,
                alcohol_free: true,
                paraben_free: true,
                comedogenic_level: 0,
                texture: "Fluid",
                product_type: "Sunscreen",
                ai_priority_score: 95,
                ai_recommendation_reason: "Kem chống nắng không chứa dầu (Oil-free) bảo vệ da mụn và Rosacea khỏi tác hại bùng phát của tia UV.",
            },
        ];

        const insertedProducts = await Product.insertMany(productsData);
        console.log(`Seeded ${insertedProducts.length} Products.`);

        // Find created products by slug
        const paulaBha = insertedProducts.find((p) => p.slug === "paulas-choice-2-bha-liquid-exfoliant");
        const ceraveCream = insertedProducts.find((p) => p.slug === "cerave-moisturizing-cream");
        const cicaplastB5 = insertedProducts.find((p) => p.slug === "la-roche-posay-cicaplast-baume-b5-plus");
        const dermagorAzelaic = insertedProducts.find((p) => p.slug === "dermagor-azelaic-acid-15-gel");
        const eucerinUrea = insertedProducts.find((p) => p.slug === "eucerin-roughness-relief-10-urea");
        const antheliosSun = insertedProducts.find((p) => p.slug === "la-roche-posay-anthelios-dry-touch-spf50");

        // ==========================================
        // 3. SEED DISEASE-PRODUCT MAPPINGS
        // ==========================================
        const mappingsData = [
            // Acne Mappings
            {
                disease_id: "Acne",
                product_id: paulaBha._id,
                priority: 95,
                reason: "Salicylic Acid 2% thâm nhập sâu vào lỗ chân lông bạt sừng và làm sạch cồi mụn bít tắc.",
                recommended_stage: "All Stages",
                morning: false,
                night: true,
                confidence: 0.98,
            },
            {
                disease_id: "Acne",
                product_id: antheliosSun._id,
                priority: 90,
                reason: "Kem chống nắng Oil-free kiểm soát dầu bảo vệ vết thâm mụn khỏi tia UV.",
                recommended_stage: "All Stages",
                morning: true,
                night: false,
                confidence: 0.95,
            },
            // Eczema Mappings
            {
                disease_id: "Eczema",
                product_id: ceraveCream._id,
                priority: 98,
                reason: "Bổ sung Ceramide thiết yếu phục hồi hàng rào lipid bị vỡ nát của bệnh nhân chàm.",
                recommended_stage: "All Stages",
                morning: true,
                night: true,
                confidence: 0.99,
            },
            {
                disease_id: "Eczema",
                product_id: cicaplastB5._id,
                priority: 92,
                reason: "5% Panthenol B5 xoa dịu cơn ngứa ngáy và thúc đẩy lành vết nứt nẻ.",
                recommended_stage: "Acute Flare",
                morning: true,
                night: true,
                confidence: 0.94,
            },
            // Rosacea Mappings
            {
                disease_id: "Rosacea",
                product_id: dermagorAzelaic._id,
                priority: 97,
                reason: "Azelaic Acid 15% là thuốc bôi số 1 dập tắt hồng ban đỏ mặt và sẩn mủ Rosacea.",
                recommended_stage: "All Stages",
                morning: true,
                night: true,
                confidence: 0.98,
            },
            {
                disease_id: "Rosacea",
                product_id: cicaplastB5._id,
                priority: 90,
                reason: "Làm mát dịu tức thì cảm giác nóng rát rần rần do giãn mạch Rosacea.",
                recommended_stage: "All Stages",
                morning: true,
                night: true,
                confidence: 0.92,
            },
            // Psoriasis Mappings
            {
                disease_id: "Psoriasis",
                product_id: eucerinUrea._id,
                priority: 96,
                reason: "Urea 10% bào mòn mảng vảy bạc cứng và cấp ẩm sâu cho mảng vảy nến.",
                recommended_stage: "All Stages",
                morning: true,
                night: true,
                confidence: 0.96,
            },
        ];

        const insertedMappings = await DiseaseProductMapping.insertMany(mappingsData);
        console.log(`Seeded ${insertedMappings.length} DiseaseProductMappings.`);

        console.log("\n==========================================");
        console.log("DATABASE SEEDING COMPLETED SUCCESSFULLY!");
        console.log("==========================================\n");

        process.exit(0);
    } catch (error) {
        console.error("Seeding Error:", error);
        process.exit(1);
    }
};

seedDatabase();
