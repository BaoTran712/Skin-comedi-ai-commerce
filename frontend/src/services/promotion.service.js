import ApiClient from "./api.service";

class PromotionService {
  constructor(baseUrl = "/api/promotion") {
    this.api = ApiClient(baseUrl);
  }

  async getAllPromotions() {
    return (await this.api.get("/")).data;
  }

  async getPromotionById(id) {
    return (await this.api.get(`/${id}`)).data;
  }

  async createPromotion(data) {
    return (await this.api.post("/", data)).data;
  }

  async updatePromotion(id, data) {
    return (await this.api.put(`/${id}`, data)).data;
  }

  async deletePromotion(id) {
    return (await this.api.delete(`/${id}`)).data;
  }
}

export default PromotionService;
