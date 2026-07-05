import mongoose from "mongoose";

const diagnosisSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
    },
    image_url: {
        type: String,
        required: true,
    },
    result: {
        type: String, // Diagnosis result from AI (e.g., "Mụn trứng cá", "Da dầu")
        required: true,
    },
    confidence: {
        type: Number, // AI confidence score
        default: 0,
    },
    recommended_products: [{
        type: mongoose.Schema.ObjectId,
        ref: "Product",
    }],
    notes: {
        type: String,
        default: "",
    },
    status: {
        type: String,
        enum: ["pending", "completed", "reviewed"],
        default: "completed",
    }
},
    {
        timestamps: true,
    }
);

const Diagnosis = mongoose.model("Diagnosis", diagnosisSchema);
export default Diagnosis;
