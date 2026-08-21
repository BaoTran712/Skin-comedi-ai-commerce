import Product from "../models/product.model.js";
import Order from "../models/order.model.js";
import { queryChatbot } from "./rag.service.js";

class ChatService {
    async getResponse(message, history = [], aiContext = null, userId = null) {
        try {
            const lowerMessage = message.toLowerCase();
            let aiResponse;
            let orderContext = "";
            let productsContext = "";
            let suggestedProducts = [];

            // 1. Check order inquiries
            const isAskingAboutOrder = lowerMessage.includes("đơn hàng") || lowerMessage.includes("don hang") || lowerMessage.includes("order") || lowerMessage.includes("mã đơn") || lowerMessage.includes("ma don");
            if (isAskingAboutOrder) {
                if (!userId) {
                    return {
                        text: "Bạn vui lòng đăng nhập tài khoản để tra cứu thông tin chi tiết và trạng thái đơn hàng của mình nhé.",
                        sources: [],
                        suggestedProducts: []
                    };
                } else {
                    const userOrders = await Order.find({ user_id: userId }).sort({ order_date: -1 }).limit(3);
                    if (userOrders.length === 0) {
                        orderContext = "\n[Thông tin đơn hàng của người dùng: Người dùng này chưa thực hiện bất cứ đơn hàng nào trên hệ thống.]\n";
                    } else {
                        orderContext = "\n[Thông tin các đơn hàng của người dùng đăng nhập hiện tại:]\n";
                        userOrders.forEach(o => {
                            const statusMap = {
                                pending: "Chờ xử lý",
                                confirmed: "Đã xác nhận",
                                shipping: "Đang giao hàng",
                                delivered: "Đã giao hàng",
                                completed: "Đã hoàn thành",
                                cancelled: "Đã hủy"
                            };
                            const dateStr = o.order_date ? new Date(o.order_date).toLocaleDateString('vi-VN') : 'chưa xác định';
                            const formattedTotal = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(o.total_amount);
                            orderContext += `- Mã đơn: ${o.order_code || o._id}, Ngày đặt: ${dateStr}, Trạng thái: ${statusMap[o.status] || o.status}, Tổng tiền: ${formattedTotal}.\n`;
                        });
                    }
                }
            }

            // 2. Look up matching products in database to feed into Gemini context & suggestion list
            if (lowerMessage.includes("mụn") || lowerMessage.includes("acne") || (aiContext && aiContext.condition && aiContext.condition.toLowerCase().includes("acne"))) {
                suggestedProducts = await Product.find({ pathology: { $in: ["mụn"] } }).limit(3);
            } else if (lowerMessage.includes("khô") || lowerMessage.includes("dry") || (aiContext && aiContext.condition && aiContext.condition.toLowerCase().includes("dry"))) {
                suggestedProducts = await Product.find({ skin_type: { $in: ["da khô"] } }).limit(3);
            } else if (lowerMessage.includes("nám") || lowerMessage.includes("tàn nhang") || (aiContext && aiContext.condition && aiContext.condition.toLowerCase().includes("melasma"))) {
                suggestedProducts = await Product.find({ pathology: { $in: ["nám"] } }).limit(3);
            }

            if (suggestedProducts.length > 0) {
                productsContext = "\n[DANH SÁCH SẢN PHẨM PHÙ HỢP HIỆN CÓ TRONG KHO HÀNG CỦA CỬA HÀNG:]\n";
                suggestedProducts.forEach(p => {
                    productsContext += `- Tên sản phẩm: ${p.title}, Giá: ${p.price.toLocaleString('vi-VN')} VND, Tình trạng: ${p.quantity > 0 ? "Còn hàng" : "Hết hàng"}\n`;
                });
            }

            // 3. Generate AI response using RAG
            try {
                aiResponse = await queryChatbot(message, history, aiContext, orderContext, productsContext);
            } catch (error) {
                console.error("RAG generation error:", error);
                aiResponse = { text: "Xin lỗi, hiện tại tôi không thể kết nối đến máy chủ AI. Vui lòng thử lại sau.", sources: [] };
            }

            return {
                text: aiResponse.text,
                sources: aiResponse.sources,
                suggestedProducts: suggestedProducts.slice(0, 2)
            };
        } catch (error) {
            console.error("Chat Error:", error);
            throw error;
        }
    }
}

export default ChatService;
