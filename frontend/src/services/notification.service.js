import createApiClient from "./api.service";

class NotificationService {
    constructor(baseUrl = "/api/notification") {
        this.api = createApiClient(baseUrl);
    }
    
    async getMyNotifications() {
        return (await this.api.get(`/`)).data;
    }

    async markAsRead(id) {
        return (await this.api.patch(`/${id}/read`)).data;
    }

    async markAllAsRead() {
        return (await this.api.patch(`/read-all`)).data;
    }
}

export default new NotificationService();
