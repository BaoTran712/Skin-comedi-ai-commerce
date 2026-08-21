import { getAIRecommendations } from "../services/recommendationEngine.service.js";

export const recommendProducts = async (req, res) => {
    try {
        const { disease, skinType, isPregnant, isChild, limit } = req.body;

        if (!disease) {
            return res.status(400).json({
                success: false,
                message: "Trường 'disease' (tên bệnh da liễu) là bắt buộc.",
            });
        }

        const result = await getAIRecommendations({
            disease,
            skinType: skinType || "Da nhạy cảm",
            isPregnant: Boolean(isPregnant),
            isChild: Boolean(isChild),
            limit: limit ? parseInt(limit, 10) : 6,
        });

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error("AI Recommendation Error:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi máy chủ khi tính toán gợi ý sản phẩm AI.",
            error: error.message,
        });
    }
};
