import mongoose from "mongoose";

const ingredientSchema = mongoose.Schema(
    {
        name: {
            type: String, // e.g. "Salicylic Acid", "Azelaic Acid", "Ceramides", "Urea"
            required: true,
            unique: true,
            index: true,
        },
        description: {
            type: String,
            default: "",
        },
        benefits: {
            type: [String], // e.g. ["Bạt sừng", "Kháng viêm", "Gom cồi mụn", "Phục hồi hàng rào da"]
            default: [],
        },
        mechanism: {
            type: String, // Dermatological mechanism of action
            default: "",
        },
        recommended_for: {
            type: [String], // Target skin conditions or skin types
            default: [],
        },
        avoid_for: {
            type: [String], // Contraindicated skin conditions or skin types
            default: [],
        },
        compatible_with: {
            type: [String], // Active ingredients that synergy well
            default: [],
        },
        not_compatible_with: {
            type: [String], // Active ingredients that clash or cause severe irritation
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

const Ingredient = mongoose.models.Ingredient || mongoose.model("Ingredient", ingredientSchema);
export default Ingredient;
