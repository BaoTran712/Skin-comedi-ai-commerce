// frontend/src/services/adminRevenue.service.js

import ApiClient from "./api.service";

class AdminRevenueService {
  constructor(baseUrl = "/api/admin/revenue") {
    this.api = ApiClient(baseUrl);
  }

  /**
   * Get revenue aggregation for a given period (day, week, month, quarter, year)
   */
  async getRevenueByPeriod(period = "day") {
    return (await this.api.get(`/${period}`)).data;
  }
}

export default AdminRevenueService;
