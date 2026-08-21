import Product from "../models/product.model.js";
import DiseaseProductMapping from "../models/diseaseProductMapping.model.js";
import DiseaseIngredient from "../models/diseaseIngredient.model.js";
import Ingredient from "../models/ingredient.model.js";

/**
 * Malignant / Cancerous conditions that STRICTLY BLOCK cosmetic product recommendations
 */
const CANCER_CONDITIONS = [
    "melanoma",
    "basal cell carcinoma",
    "basal_cell_carcinoma",
    "actinic keratosis",
    "actinic_keratosis",
    "kb_010",
    "kb_011",
    "kb_016",
];

/**
 * Priorities for specific diseases defined in system prompt
 */
const SPECIFIC_DISEASE_PRIORITY_INGREDIENTS = {
    Acne: ["Salicylic Acid", "Niacinamide", "Benzoyl Peroxide", "Zinc PCA", "Oil Free Moisturizer"],
    Eczema: ["Ceramides", "Panthenol", "Colloidal Oatmeal", "Petroleum Jelly", "Mineral Sunscreen"],
    Rosacea: ["Azelaic Acid", "Ceramides", "Panthenol", "Centella Asiatica", "Zinc Oxide"],
    Psoriasis: ["Urea", "Ceramides", "Salicylic Acid", "Coal Tar", "Lactic Acid"],
    Tinea: ["Tea Tree Oil", "Zinc Pyrithione", "Gentle Cleanser", "Antifungal Support"],
};

/**
 * Calculate multi-factor AI Recommendation Score for a product
 */
const calculateProductScore = ({
    product,
    mappingPriority = 0,
    priorityIngredients = [],
    userSkinType = "",
    isPregnant = false,
    isChild = false,
}) => {
    let score = 50; // Base score

    // 1. Disease-Product Direct Mapping Priority (Weight: 40%)
    if (mappingPriority > 0) {
        score += (mappingPriority / 100) * 40;
    }

    // 2. Priority Active Ingredients Match (Weight: 30%)
    const productTags = (product.ingredient_tags || []).map((t) => t.toLowerCase());
    const productIngredients = (product.main_ingredients || []).map((i) => i.toLowerCase());

    let ingredientMatches = 0;
    priorityIngredients.forEach((pIng) => {
        const lowerPIng = pIng.toLowerCase();
        if (
            productTags.some((tag) => tag.includes(lowerPIng)) ||
            productIngredients.some((ing) => ing.includes(lowerPIng))
        ) {
            ingredientMatches += 1;
        }
    });

    score += Math.min(ingredientMatches * 10, 30);

    // 3. User Skin Type Compatibility Match (Weight: 15%)
    if (userSkinType) {
        const supportedTypes = (product.skin_type_tags || []).map((s) => s.toLowerCase());
        if (supportedTypes.some((t) => t.includes(userSkinType.toLowerCase()) || t === "tất cả loại da")) {
            score += 15;
        }
    }

    // 4. Formula Quality Bonuses
    if (product.oil_free) score += 3;
    if (product.fragrance_free) score += 3;
    if (product.alcohol_free) score += 3;

    // 5. Safety Filters & Hard Penalties (-9999 for unsafe)
    if (isPregnant && product.pregnancy_safe === false) {
        return -9999;
    }

    if (isChild && product.children_safe === false) {
        return -9999;
    }

    return Math.round(score * 10) / 10;
};

/**
 * Main AI Recommendation Engine Service
 */
export const getAIRecommendations = async ({
    disease,
    skinType = "Da nhạy cảm",
    isPregnant = false,
    isChild = false,
    limit = 6,
}) => {
    if (!disease) {
        throw new Error("Tên hoặc mã bệnh da liễu là bắt buộc.");
    }

    const normalizedDisease = disease.trim();
    const lowerDisease = normalizedDisease.toLowerCase();

    // -------------------------------------------------------------
    // RULE 1: MALIGNANT / CANCER SAFETY HARD BLOCK
    // -------------------------------------------------------------
    if (CANCER_CONDITIONS.some((c) => lowerDisease.includes(c))) {
        return {
            medical_emergency: true,
            status: "BLOCKED",
            disease: normalizedDisease,
            medical_warning:
                "🚨 CẢNH BÁO Y TẾ KHẨN CẤP: Kết quả nhận diện cho thấy tổn thương có nguy cơ là Ung thư da (Melanoma, Basal Cell Carcinoma) hoặc tổn thương tiền ung thư (Actinic Keratosis). Hệ thống KHÔNG ĐƯỢC PHÉP gợi ý bất kỳ sản phẩm mỹ phẩm điều trị nào. Bạn cần đến Bệnh viện chuyên khoa Da liễu hoặc Ung bướu để được khám trực tiếp và làm sinh thiết ngay lập tức!",
            recommendations: [],
            recommended_routine: null,
        };
    }

    // -------------------------------------------------------------
    // RULE 2: TINEA (NẤM DA / HẮC LAO) DISPOSAL & SPECIAL WARNING
    // -------------------------------------------------------------
    let specialWarning = null;
    if (lowerDisease.includes("tinea") || lowerDisease.includes("hắc lao") || lowerDisease.includes("nấm da")) {
        specialWarning =
            "⚠️ LƯU Ý Y KHOA QUAN TRỌNG: Phương pháp điều trị chính của bệnh Nấm da / Hắc lao là THUỐC CHỐNG NẤM ĐẶC TRỊ (như Terbinafine, Ketoconazole) theo chỉ định của Bác sĩ hoặc Dược sĩ. Các sản phẩm bên dưới chỉ đóng vai trò hỗ trợ làm sạch dịu nhẹ và phục hồi da rào cản.";
    }

    // Fetch Direct Disease-Product Mappings
    const directMappings = await DiseaseProductMapping.find({
        disease_id: { $regex: new RegExp(normalizedDisease, "i") },
    }).populate("product_id");

    const mappedProductIds = directMappings.map((m) => m.product_id?._id).filter(Boolean);
    const mappingScoreMap = new Map();
    const mappingReasonMap = new Map();

    directMappings.forEach((m) => {
        if (m.product_id) {
            mappingScoreMap.set(m.product_id._id.toString(), m.priority);
            mappingReasonMap.set(m.product_id._id.toString(), m.reason);
        }
    });

    // Fetch Priority Ingredients for this disease
    let priorityIngredients = SPECIFIC_DISEASE_PRIORITY_INGREDIENTS[normalizedDisease] || [];
    if (priorityIngredients.length === 0) {
        const diseaseIngs = await DiseaseIngredient.find({
            disease_id: { $regex: new RegExp(normalizedDisease, "i") },
            recommended: true,
        }).sort({ priority: -1 });

        priorityIngredients = diseaseIngs.map((i) => i.ingredient_name);
    }

    // Fetch Candidate Products
    let query = {
        $or: [
            { _id: { $in: mappedProductIds } },
            { skin_conditions_supported: { $regex: new RegExp(normalizedDisease, "i") } },
            { ingredient_tags: { $in: priorityIngredients.map((i) => new RegExp(i, "i")) } },
        ],
    };

    let candidateProducts = await Product.find(query).populate("brand_id");

    // Fallback if catalog is sparse
    if (candidateProducts.length === 0) {
        candidateProducts = await Product.find({}).populate("brand_id").limit(10);
    }

    // Calculate Recommendation Score for each product
    const scoredProducts = candidateProducts
        .map((product) => {
            const pIdStr = product._id.toString();
            const mappingPriority = mappingScoreMap.get(pIdStr) || 0;
            const customReason = mappingReasonMap.get(pIdStr) || product.ai_recommendation_reason;

            const finalScore = calculateProductScore({
                product,
                mappingPriority,
                priorityIngredients,
                userSkinType: skinType,
                isPregnant,
                isChild,
            });

            return {
                product,
                recommendation_score: finalScore,
                reason:
                    customReason ||
                    `Sản phẩm chứa hoạt chất ${priorityIngredients.slice(0, 2).join(", ")} phù hợp cho tình trạng ${normalizedDisease}`,
            };
        })
        .filter((item) => item.recommendation_score > 0) // Filter out safety hard penalties (-9999)
        .sort((a, b) => b.recommendation_score - a.recommendation_score);

    const topProducts = scoredProducts.slice(0, limit);

    // Build Routine Steps
    const routine = {
        cleanser: topProducts.find((p) => p.product.product_type === "Cleanser") || topProducts[0] || null,
        treatment: topProducts.find((p) => p.product.product_type === "Treatment" || p.product.product_type === "Serum") || topProducts[1] || null,
        moisturizer: topProducts.find((p) => p.product.product_type === "Moisturizer") || topProducts[2] || null,
        sunscreen: topProducts.find((p) => p.product.product_type === "Sunscreen") || topProducts[3] || null,
    };

    return {
        medical_emergency: false,
        status: "SUCCESS",
        disease: normalizedDisease,
        special_warning: specialWarning,
        priority_ingredients: priorityIngredients,
        user_context: { skinType, isPregnant, isChild },
        total_matched: topProducts.length,
        recommendations: topProducts.map((item) => {
            const prodObj = item.product.toObject ? item.product.toObject() : item.product;
            return {
                ...prodObj,
                id: item.product._id,
                _id: item.product._id,
                name: item.product.name || item.product.title,
                title: item.product.title || item.product.name,
                slug: item.product.slug,
                price: item.product.price,
                quantity: (item.product.quantity !== undefined && item.product.quantity !== null && item.product.quantity > 0) ? item.product.quantity : 50,
                image: item.product.image,
                brand_id: item.product.brand_id,
                brand: item.product.brand_id?.name || item.product.brand || "SkinMedi AI",
                category: item.product.category,
                product_type: item.product.product_type,
                texture: item.product.texture,
                skin_type: item.product.skin_type || [],
                pathology: item.product.pathology || [],
                main_ingredients: item.product.main_ingredients,
                recommendation_score: item.recommendation_score,
                recommendation_reason: item.reason,
                usage_schedule: {
                    morning: item.product.morning_use,
                    night: item.product.night_use,
                    steps: item.product.usage_steps,
                    requires_sunscreen: item.product.requires_sunscreen,
                },
                safety_tags: {
                    oil_free: item.product.oil_free,
                    fragrance_free: item.product.fragrance_free,
                    alcohol_free: item.product.alcohol_free,
                    pregnancy_safe: item.product.pregnancy_safe,
                    children_safe: item.product.children_safe,
                },
            };
        }),
        recommended_routine: routine,
    };
};
