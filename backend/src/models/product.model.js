import mongoose from "mongoose";

const productSchema = mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
        },
        price: {
            type: Number,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            default: 0,
        },
        expiry_date: {
            type: String,
            default: "12/2027",
        },
        brand_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Brand",
        },
        brand: {
            type: String,
            default: "",
        },
        category_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
        },
        category: {
            type: String,
            default: "",
        },
        description: {
            type: String,
            default: "",
        },
        image: {
            type: String,
            default: null,
        },
        imageSource: {
            type: String,
            enum: ['missing', 'local', 'admin_upload'],
            default: 'missing',
        },
        imageVerified: {
            type: Boolean,
            default: false,
        },

        // --- Medical & AI Recommendation Fields ---
        main_ingredients: {
            type: [String], // e.g. ["Salicylic Acid 2%", "Niacinamide 5%", "Zinc PCA"]
            default: [],
        },
        ingredient_tags: {
            type: [String], // e.g. ["BHA", "Niacinamide", "Zinc", "Ceramide"]
            default: [],
        },
        skin_type_tags: {
            type: [String], // e.g. ["Da dầu", "Da hỗn hợp", "Da mụn", "Da nhạy cảm"]
            default: [],
        },
        skin_conditions_supported: {
            type: [String], // e.g. ["Acne", "Seborrheic Dermatitis", "Blackheads"]
            default: [],
        },
        skin_conditions_not_supported: {
            type: [String], // e.g. ["Open Wounds", "Eczema Flare-up"]
            default: [],
        },

        // Usage & Protocol
        usage: {
            type: String,
            default: "",
        },
        morning_use: {
            type: Boolean,
            default: true,
        },
        night_use: {
            type: Boolean,
            default: true,
        },
        requires_sunscreen: {
            type: Boolean,
            default: false,
        },
        usage_steps: {
            type: String, // e.g. "Bước 3: Sau bước rửa mặt và toner"
            default: "",
        },
        usage_frequency: {
            type: String, // e.g. "2 lần / ngày"
            default: "1 lần / ngày",
        },

        // Safety & Age suitability
        pregnancy_safe: {
            type: Boolean,
            default: true,
        },
        children_safe: {
            type: Boolean,
            default: false,
        },
        recommended_age: {
            type: String, // e.g. "12+", "16+", "Mọi lứa tuổi"
            default: "12+",
        },
        contraindications: {
            type: String, // e.g. "Không dùng cho người dị ứng với Aspirin/Salicylate"
            default: "",
        },
        medical_warning: {
            type: String,
            default: "",
        },

        // Formulas & Interactivity
        compatible_ingredients: {
            type: [String], // e.g. ["Hyaluronic Acid", "Niacinamide", "B5"]
            default: [],
        },
        incompatible_ingredients: {
            type: [String], // e.g. ["Retinol", "Vitamin C LAA", "Glycolic Acid"]
            default: [],
        },
        benefits: {
            type: [String], // e.g. ["Gom cồi mụn", "Giảm tiết bã nhờn", "Mờ thâm"]
            default: [],
        },

        // Formula attributes
        oil_free: {
            type: Boolean,
            default: false,
        },
        fragrance_free: {
            type: Boolean,
            default: true,
        },
        alcohol_free: {
            type: Boolean,
            default: true,
        },
        paraben_free: {
            type: Boolean,
            default: true,
        },
        comedogenic_level: {
            type: Number, // 0 to 5 scale (0 = Non-comedogenic)
            default: 0,
        },
        texture: {
            type: String, // e.g. "Gel", "Cream", "Lotion", "Serum", "Ointment"
            default: "Serum",
        },
        product_type: {
            type: String, // e.g. "Cleanser", "Moisturizer", "Serum", "Sunscreen", "Treatment"
            default: "Treatment",
        },

        // AI Priority & Recommendations
        ai_priority_score: {
            type: Number, // Base priority 1-100
            default: 50,
            index: true,
        },
        ai_recommendation_reason: {
            type: String,
            default: "",
        },

        // Additional E-commerce Fields
        flash_sale_price: {
            type: Number,
            default: null,
        },
        flash_sale_end_time: {
            type: Date,
            default: null,
        },
        has_variants: {
            type: Boolean,
            default: false,
        },
        prescription_required: {
            type: Boolean,
            default: false,
        },
        origin_country: {
            type: String,
            default: "Pháp",
        },
    },
    {
        timestamps: true,
    }
);

// Search Indexes for fast recommendation querying
productSchema.index({ skin_conditions_supported: 1, ai_priority_score: -1 });
productSchema.index({ ingredient_tags: 1 });

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
export default Product;
