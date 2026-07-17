import express from "express";
import * as settingController from "../controllers/setting.controller.js";
import passport from "passport";

const router = express.Router();

// Public route - get setting by key or get all settings (some might be needed for frontend render)
router.get("/", settingController.getAllSettings);
router.get("/:key", settingController.getSettingByKey);

// Protected routes (admin/staff only)
// Note: We might want to add role checking middleware here
router.post("/", passport.authenticate("jwt", { session: false }), settingController.createSetting);
router.put("/:id", passport.authenticate("jwt", { session: false }), settingController.updateSetting);
router.delete("/:id", passport.authenticate("jwt", { session: false }), settingController.deleteSetting);

export default router;
