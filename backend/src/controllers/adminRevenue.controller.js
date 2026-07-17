// backend/src/controllers/adminRevenue.controller.js

import AdminRevenueService from "../services/adminRevenue.service.js";

const adminRevenueService = new AdminRevenueService();

/**
 * GET /api/admin/revenue/:period
 * Returns revenue aggregation for the given period (day, week, month, quarter, year).
 */
export async function getRevenueByPeriod(req, res, next) {
  try {
    const period = req.params.period || "day";
    const data = await adminRevenueService.getRevenueByPeriod(period);
    res.json(data);
  } catch (error) {
    next(error);
  }
}
