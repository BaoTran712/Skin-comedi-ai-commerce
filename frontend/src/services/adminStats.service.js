// frontend/src/services/adminStats.service.js

import ApiClient from "./api.service";

class AdminStatsService {
  constructor(baseUrl = "/api/admin") {
    this.api = ApiClient(baseUrl);
  }

  /**
   * Get all KPI data for the admin dashboard.
   */
  async getDashboardStats() {
    return (await this.api.get("/stats")).data;
  }
}

export default AdminStatsService;
