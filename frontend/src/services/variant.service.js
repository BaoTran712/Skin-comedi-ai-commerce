import ApiClient from "./api.service";

class VariantService {
  constructor(baseUrl = "/api/variant") {
    this.api = ApiClient(baseUrl);
  }

  async getVariantsByProductId(productId) {
    return (await this.api.get(`/product/${productId}`)).data;
  }

  async createVariant(data) {
    return (await this.api.post("/", data)).data;
  }

  async updateVariant(id, data) {
    return (await this.api.put(`/${id}`, data)).data;
  }

  async deleteVariant(id) {
    return (await this.api.delete(`/${id}`)).data;
  }
}

export default VariantService;
