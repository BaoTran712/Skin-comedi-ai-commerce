import ApiClient from "./api.service";

class IngredientService {
  constructor(baseUrl = "/api/ingredient") {
    this.api = ApiClient(baseUrl);
  }

  async getAllIngredients() {
    return (await this.api.get("/")).data;
  }

  async getIngredientById(id) {
    return (await this.api.get(`/${id}`)).data;
  }

  async createIngredient(data) {
    return (await this.api.post("/", data)).data;
  }

  async updateIngredient(id, data) {
    return (await this.api.put(`/${id}`, data)).data;
  }

  async deleteIngredient(id) {
    return (await this.api.delete(`/${id}`)).data;
  }
}

export default IngredientService;
