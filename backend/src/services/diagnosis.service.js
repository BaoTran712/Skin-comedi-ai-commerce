import Diagnosis from "../models/diagnosis.model.js";
import ProductService from "./product.service.js";

class DiagnosisService {
    constructor() {
        this.productService = new ProductService();
    }

    async create(payload) {
        try {
            // Simulated AI Analysis Logic
            // In a real app, this would call an external AI API (Gemini, etc.)
            const mockAnalysis = this.simulateAIAnalysis(payload.image_url);
            
            const recommendations = await this.productService.getRecommendationsByTraits(
                mockAnalysis.skin_type, 
                mockAnalysis.pathology
            );

            const diagnosisData = {
                user_id: payload.user_id,
                image_url: payload.image_url,
                result: mockAnalysis.result,
                confidence: mockAnalysis.confidence,
                recommended_products: recommendations.map(p => p._id),
                notes: payload.notes || ""
            };

            const diagnosis = new Diagnosis(diagnosisData);
            const savedDiagnosis = await diagnosis.save();
            
            return {
                ...savedDiagnosis.toObject(),
                recommended_products: recommendations // Return full product objects for the frontend
            };
        } catch (error) {
            console.error("Error creating diagnosis:", error);
            throw error;
        }
    }

    async getHistory(userId) {
        return await Diagnosis.find({ user_id: userId })
            .sort({ createdAt: -1 })
            .populate("recommended_products");
    }

    async getLatest(userId) {
        return await Diagnosis.findOne({ user_id: userId })
            .sort({ createdAt: -1 })
            .populate("recommended_products");
    }

    simulateAIAnalysis(imageUrl) {
        // Simple logic to simulate different results for demo purposes
        const results = [
            { result: "Da mụn trứng cá", pathology: "mụn", skin_type: "da dầu", confidence: 0.92 },
            { result: "Da khô thiếu nước", pathology: "khô da", skin_type: "da khô", confidence: 0.88 },
            { result: "Da bị nám, tàn nhang", pathology: "nám", skin_type: "mọi loại da", confidence: 0.85 },
            { result: "Da nhạy cảm, mẩn đỏ", pathology: "mẩn đỏ", skin_type: "da nhạy cảm", confidence: 0.90 }
        ];
        return results[Math.floor(Math.random() * results.length)];
    }
}

export default DiagnosisService;
