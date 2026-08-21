import mongoose from "mongoose";

const diseaseIngredientSchema = mongoose.Schema(
    {
        disease_id: {
            type: String, // e.g. "KB_001", "Acne", "Eczema", "Rosacea", "Psoriasis", "Tinea"
            required: true,
            index: true,
        },
        ingredient_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ingredient",
            required: true,
        },
        ingredient_name: {
            type: String, // e.g. "Salicylic Acid"
            required: true,
        },
        priority: {
            type: Number, // 1 to 100 (100 = First-line active ingredient)
            required: true,
            default: 50,
        },
        recommended: {
            type: Boolean, // true = Recommended, false = Neutral
            default: true,
        },
        avoid: {
            type: Boolean, // true = Strongly Avoid/Contraindicated
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

diseaseIngredientSchema.index({ disease_id: 1, priority: -1 });

const DiseaseIngredient =
    mongoose.models.DiseaseIngredient ||
    mongoose.model("DiseaseIngredient", diseaseIngredientSchema);

export default DiseaseIngredient;
