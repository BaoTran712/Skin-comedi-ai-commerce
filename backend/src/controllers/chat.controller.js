import ChatService from "../services/chat.service.js";
import ApiError from "../api-error.js";

class ChatController {
    constructor() {
        this.chatService = new ChatService();
    }

    processMessage = async (req, res, next) => {
        try {
            const { message } = req.body;
            if (!message) {
                return next(new ApiError(400, "Message is required"));
            }

            const result = await this.chatService.getResponse(message);
            return res.json(result);
        } catch (error) {
            return next(new ApiError(500, "An error occurred while processing your message"));
        }
    }
}

export default new ChatController();
