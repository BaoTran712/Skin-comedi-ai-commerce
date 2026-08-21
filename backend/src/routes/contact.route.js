import express from "express";
import { auth, authorize } from "../middlewares/auth.middleware.js";
import ContactController from "../controllers/contact.controller.js";

const router = express.Router();

router.post("/", ContactController.create);
router.get("/", auth, authorize("ADMIN", "STAFF"), ContactController.findAll);
router.get("/:id", auth, authorize("ADMIN", "STAFF"), ContactController.findOne);
router.put("/:id/status", auth, authorize("ADMIN", "STAFF"), ContactController.updateStatus);
router.delete("/:id", auth, authorize("ADMIN"), ContactController.deleteOne);

export default router;
