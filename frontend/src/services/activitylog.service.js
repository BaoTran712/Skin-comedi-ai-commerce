import ApiClient from "./api.service";

class ActivityLogService {
  constructor(baseUrl = "/api/activitylog") {
    this.api = ApiClient(baseUrl);
  }

  async getAllLogs() {
    return (await this.api.get("/")).data;
  }

  async deleteLog(id) {
    return (await this.api.delete(`/${id}`)).data;
  }

  async clearAllLogs() {
    return (await this.api.delete("/")).data;
  }
}

export default ActivityLogService;
