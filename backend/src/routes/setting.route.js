import express from "express";
import { auth, authorize } from "../middlewares/auth.middleware.js";
import * as settingController from "../controllers/setting.controller.js";

const router = express.Router();

// Public routes - get setting by key or get all settings
router.get("/", settingController.getAllSettings);
router.get("/:key", settingController.getSettingByKey);

// Protected routes – ADMIN ONLY
router.post("/", auth, authorize("ADMIN"), settingController.createSetting);
router.put("/:id", auth, authorize("ADMIN"), settingController.updateSetting);
router.delete("/:id", auth, authorize("ADMIN"), settingController.deleteSetting);

export default router;
