import ApiClient from "./api.service";

class BrandService {
  constructor(baseUrl = "/api/brand") {
    this.api = ApiClient(baseUrl);
  }

  async getAllBrands() {
    return (await this.api.get("/")).data;
  }

  async getBrandById(id) {
    return (await this.api.get(`/${id}`)).data;
  }

  async createBrand(data) {
    return (await this.api.post("/", data)).data;
  }

  async updateBrand(id, data) {
    return (await this.api.put(`/${id}`, data)).data;
  }

  async deleteBrand(id) {
    return (await this.api.delete(`/${id}`)).data;
  }

  async deleteAllBrands() {
    return (await this.api.delete("/")).data;
  }
}

export default BrandService;
