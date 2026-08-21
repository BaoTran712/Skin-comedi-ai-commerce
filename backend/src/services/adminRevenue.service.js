// backend/src/services/adminRevenue.service.js

import Order from "../models/order.model.js";

/**
 * Service to provide revenue analytics for the admin dashboard.
 * Uses order_date (not createdAt) to support demo/seeded orders.
 */
class AdminRevenueService {
    async getRevenueByPeriod(period = "day") {
        const unitMap = {
            day:     "%Y-%m-%d",
            week:    "%Y-%U",
            month:   "%Y-%m",
            quarter: "%Y-%q",
            year:    "%Y",
        };
        const format = unitMap[period] || unitMap.day;
        const pipeline = [
            { $match: { status: { $in: ["delivered", "completed"] } } },
            {
                $group: {
                    _id: { $dateToString: { format, date: "$order_date" } },
                    revenue: { $sum: "$total_amount" },
                },
            },
            { $sort: { "_id": 1 } },
            { $project: { _id: 0, label: "$_id", revenue: 1 } },
        ];
        return await Order.aggregate(pipeline);
    }
}

export default AdminRevenueService;
