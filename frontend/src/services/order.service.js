import ApiClient from "./api.service";

class OrderService {
  constructor(baseUrl = "/api/order") {
    this.api = ApiClient(baseUrl);
  }

  async getAllOrders(params = {}) {
    return (await this.api.get("/", { params })).data;
  }

  async getOrderById(id) {
    return (await this.api.get(`/${id}`)).data;
  }

  async createOrder(data) {
    return (await this.api.post("/", data)).data;
  }

  async updateOrder(id, data) {
    return (await this.api.put(`/${id}`, data)).data;
  }

  async deleteOrder(id) {
    return (await this.api.delete(`/${id}`)).data;
  }

  async deleteAllOrders() {
    return (await this.api.delete("/")).data;
  }

  async getStats() {
    return (await this.api.get("/stats")).data;
  }
}

export default OrderService;
