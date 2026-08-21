import createApiClient from "./api.service";

class ChatService {
    constructor(baseUrl = "/api/chat") {
        this.api = createApiClient(baseUrl);
    }

    async sendMessage(message, history = [], aiContext = null) {
        return (await this.api.post("/", { message, history, aiContext })).data;
    }
}

export default ChatService;
