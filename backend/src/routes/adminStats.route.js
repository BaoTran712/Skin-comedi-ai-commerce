import express from "express";
import { auth, authorize } from "../middlewares/auth.middleware.js";
import { getDashboardStats } from "../controllers/adminStats.controller.js";

const router = express.Router();

// Dashboard stats – ADMIN or STAFF
router.get("/stats", auth, authorize("ADMIN", "STAFF"), getDashboardStats);

export default router;
