import express from "express";
import { auth, authorize } from "../middlewares/auth.middleware.js";
import { getRevenueByPeriod } from "../controllers/adminRevenue.controller.js";

const router = express.Router();

// Sensitive revenue financial reports – ADMIN ONLY
router.get("/:period", auth, authorize("ADMIN"), getRevenueByPeriod);

export default router;
