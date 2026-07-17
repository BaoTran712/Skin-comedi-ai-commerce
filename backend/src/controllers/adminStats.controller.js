// backend/src/controllers/adminStats.controller.js

import AdminStatsService from "../services/adminStats.service.js";

const adminStatsService = new AdminStatsService();

/**
 * GET /api/admin/stats
 * Returns all KPI data for the admin dashboard.
 */
export async function getDashboardStats(req, res, next) {
  try {
    const stats = await adminStatsService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
}
