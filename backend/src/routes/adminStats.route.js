// backend/src/routes/adminStats.route.js

import express from "express";
import { auth } from "../middlewares/auth.middleware.js";
import { getDashboardStats } from "../controllers/adminStats.controller.js";

const router = express.Router();

// All admin dashboard routes are protected – only staff with appropriate role can access.
router.get("/stats", auth, getDashboardStats);

export default router;
