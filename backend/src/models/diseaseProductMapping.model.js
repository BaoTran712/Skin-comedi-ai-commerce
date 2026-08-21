import mongoose from "mongoose";

const diseaseProductMappingSchema = mongoose.Schema(
    {
        disease_id: {
            type: String, // e.g. "KB_001", "Acne", "Eczema", "Rosacea", "Psoriasis"
            required: true,
            index: true,
        },
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            index: true,
        },
        priority: {
            type: Number, // 1 to 100 (100 = Tier 1 Gold Standard)
            required: true,
            default: 50,
        },
        reason: {
            type: String, // Clinical rationale for why this product treats this disease
            required: true,
        },
        recommended_stage: {
            type: String, // e.g. "Acute Flare", "Maintenance", "Post-treatment Recovery", "All Stages"
            default: "All Stages",
        },
        morning: {
            type: Boolean,
            default: true,
        },
        night: {
            type: Boolean,
            default: true,
        },
        confidence: {
            type: Number, // 0.0 to 1.0 (Clinical confidence score)
            default: 0.9,
        },
    },
    {
        timestamps: true,
    }
);

diseaseProductMappingSchema.index({ disease_id: 1, priority: -1 });

const DiseaseProductMapping =
    mongoose.models.DiseaseProductMapping ||
    mongoose.model("DiseaseProductMapping", diseaseProductMappingSchema);

export default DiseaseProductMapping;
