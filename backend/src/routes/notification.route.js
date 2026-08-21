import express from "express";
import auth from "../middlewares/auth.middleware.js";
import NotificationController from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/", auth, NotificationController.getUserNotifications);
router.get("/unread-count", auth, NotificationController.getUnreadCount);
router.patch("/read-all", auth, NotificationController.markAllAsRead);
router.patch("/:id/read", auth, NotificationController.markAsRead);

export default router;
