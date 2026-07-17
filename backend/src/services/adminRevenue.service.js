// backend/src/services/adminRevenue.service.js

import Order from "../models/order.model.js";

/**
 * Service to provide revenue analytics for the admin dashboard.
 * Supports various period aggregations using MongoDB $dateTrunc.
 */
class AdminRevenueService {
  /**
   * Get revenue data grouped by the requested period.
   * period can be: "day", "week", "month", "quarter", "year".
   * Returns an array of { label: string, revenue: number }.
   */
  async getRevenueByPeriod(period = "day") {
    const unitMap = {
      day: "%Y-%m-%d",
      week: "%Y-%U",
      month: "%Y-%m",
      quarter: "%Y-%q",
      year: "%Y",
    };
    const format = unitMap[period] || unitMap.day;
    const pipeline = [
      { $match: { status: { $in: ["delivered", "completed"] } } },
      {
        $group: {
          _id: { $dateToString: { format, date: "$createdAt" } },
          revenue: { $sum: "$totalPrice" },
        },
      },
      { $sort: { "_id": 1 } },
      { $project: { _id: 0, label: "$_id", revenue: 1 } },
    ];
    return await Order.aggregate(pipeline);
  }
}

export default AdminRevenueService;
