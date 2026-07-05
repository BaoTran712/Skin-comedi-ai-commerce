import Product from "../models/product.model.js";

class ChatService {
    async getResponse(message) {
        try {
            const lowerMessage = message.toLowerCase();
            let response = "";
            let suggestedProducts = [];

            // Simple keyword-based logic (Simulating an AI Agent)
            if (lowerMessage.includes("mụn") || lowerMessage.includes("acne")) {
                response = "Chào bạn! Với tình trạng da mụn, bạn nên tập trung vào việc làm sạch sâu và sử dụng các sản phẩm chứa Salicylic Acid hoặc Benzoyl Peroxide. Dưới đây là một số sản phẩm phù hợp tại Testskin:";
                suggestedProducts = await Product.find({ pathology: { $in: ["mụn"] } }).limit(2);
            } else if (lowerMessage.includes("khô") || lowerMessage.includes("dry")) {
                response = "Da khô cần được cấp ẩm sâu với các thành phần như Hyaluronic Acid và Ceramides. Bạn nên hạn chế rửa mặt bằng nước quá nóng nhé!";
                suggestedProducts = await Product.find({ skin_type: { $in: ["da khô"] } }).limit(2);
            } else if (lowerMessage.includes("nám") || lowerMessage.includes("tàn nhang")) {
                response = "Tình trạng nám và tàn nhang cần các hoạt chất làm sáng như Vitamin C, Niacinamide hoặc Retinol. Đặc biệt, đừng quên bôi kem chống nắng mỗi ngày!";
                suggestedProducts = await Product.find({ pathology: { $in: ["nám"] } }).limit(2);
            } else if (lowerMessage.includes("chào") || lowerMessage.includes("hi") || lowerMessage.includes("hello")) {
                response = "Xin chào! Tôi là trợ lý AI của Testskin. Tôi có thể giúp bạn tư vấn sản phẩm phù hợp với tình trạng da của bạn. Bạn đang gặp vấn đề gì về da không?";
            } else {
                response = "Cảm ơn bạn đã chia sẻ. Để tôi tư vấn chính xác nhất, bạn có thể cho tôi biết loại da của bạn (dầu, khô, hay nhạy cảm) hoặc vấn đề bạn đang quan tâm được không?";
                suggestedProducts = await Product.find({}).limit(2);
            }

            return {
                text: response,
                suggestedProducts: suggestedProducts
            };
        } catch (error) {
            console.error("Chat Error:", error);
            throw error;
        }
    }
}

export default ChatService;
