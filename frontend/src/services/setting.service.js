import ApiClient from "./api.service";

class SettingService {
  constructor(baseUrl = "/api/setting") {
    this.api = ApiClient(baseUrl);
  }

  async getAllSettings() {
    return (await this.api.get("/")).data;
  }

  async updateSetting(id, data) {
    return (await this.api.put(`/${id}`, data)).data;
  }

  async createSetting(data) {
    return (await this.api.post("/", data)).data;
  }

  async deleteSetting(id) {
    return (await this.api.delete(`/${id}`)).data;
  }
}

export default SettingService;
