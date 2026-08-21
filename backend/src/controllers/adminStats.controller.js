// backend/src/controllers/adminStats.controller.js

import AdminStatsService from "../services/adminStats.service.js";

const adminStatsService = new AdminStatsService();

/**
 * GET /api/admin/stats
 * Returns all KPI data for the admin dashboard.
 */
export async function getDashboardStats(req, res, next) {
  try {
    const period = req.query.period || "month";
    const date = req.query.date || "";
    const stats = await adminStatsService.getDashboardStats(period, date);
    res.json(stats);
  } catch (error) {
    next(error);
  }
}
