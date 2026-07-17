// backend/src/routes/adminRevenue.route.js

import express from "express";
import { auth } from "../middlewares/auth.middleware.js";
import { getRevenueByPeriod } from "../controllers/adminRevenue.controller.js";

const router = express.Router();

// Protected route – staff only
router.get("/:period", auth, getRevenueByPeriod);

export default router;
