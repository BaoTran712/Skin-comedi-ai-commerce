import ChatService from "../services/chat.service.js";
import ApiError from "../api-error.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

class ChatController {
    constructor() {
        this.chatService = new ChatService();
    }

    processMessage = async (req, res, next) => {
        try {
            const { message, history, aiContext } = req.body;
            if (!message) {
                return next(new ApiError(400, "Message is required"));
            }

            // Extract optional authentication token
            let userId = null;
            const token = req.headers["authorization"]?.split(" ")[1];
            if (token) {
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    userId = decoded.id || decoded._id || decoded.userId;
                } catch (err) {
                    console.log("Chat optional auth token decode failed:", err.message);
                }
            }

            const result = await this.chatService.getResponse(message, history || [], aiContext, userId);
            return res.json(result);
        } catch (error) {
            console.error("Chat Controller Error:", error);
            return next(new ApiError(500, "An error occurred while processing your message"));
        }
    }
}

export default new ChatController();
