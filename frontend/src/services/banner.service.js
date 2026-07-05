import ApiClient from "./api.service";

class BannerService {
  constructor(baseUrl = "/api/banner") {
    this.api = ApiClient(baseUrl);
  }

  async getAllBanners() {
    return (await this.api.get("/")).data;
  }

  async getBannerById(id) {
    return (await this.api.get(`/${id}`)).data;
  }

  async createBanner(data) {
    return (await this.api.post("/", data)).data;
  }

  async updateBanner(id, data) {
    return (await this.api.put(`/${id}`, data)).data;
  }

  async deleteBanner(id) {
    return (await this.api.delete(`/${id}`)).data;
  }
}

export default BannerService;
