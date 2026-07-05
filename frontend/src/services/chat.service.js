import createApiClient from "./api.service";

class ChatService {
    constructor(baseUrl = "/api/chat") {
        this.api = createApiClient(baseUrl);
    }

    async sendMessage(message) {
        return (await this.api.post("/", { message })).data;
    }
}

export default ChatService;
