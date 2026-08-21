import NotificationService from "../services/notification.service.js";
import ApiError from "../api-error.js";
import mongoose from "mongoose";

const notificationService = new NotificationService();

export async function getUserNotifications(req, res, next) {
    try {
        const userId = req.userId;
        if (!userId) {
            return next(new ApiError(401, "Unauthorized"));
        }
        const notifications = await notificationService.getUserNotifications(userId);
        return res.json(notifications);
    } catch (error) {
        console.error("Get Notifications Error:", error);
        return next(new ApiError(500, "An error occurred while fetching notifications"));
    }
}

export async function getUnreadCount(req, res, next) {
    try {
        const userId = req.userId;
        if (!userId) {
            return next(new ApiError(401, "Unauthorized"));
        }
        const unreadCount = await notificationService.getUnreadCount(userId);
        return res.json({ count: unreadCount });
    } catch (error) {
        console.error("Get Unread Count Error:", error);
        return next(new ApiError(500, "An error occurred while counting unread notifications"));
    }
}

export async function markAsRead(req, res, next) {
    try {
        const userId = req.userId;
        const notificationId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
            return next(new ApiError(400, "Invalid notification ID"));
        }

        const notification = await notificationService.markAsRead(notificationId, userId);
        if (!notification) {
            return next(new ApiError(404, "Notification not found"));
        }

        return res.json({ message: "Notification marked as read", notification });
    } catch (error) {
        console.error("Mark Read Error:", error);
        return next(new ApiError(500, "An error occurred while marking notification as read"));
    }
}

export async function markAllAsRead(req, res, next) {
    try {
        const userId = req.userId;
        const count = await notificationService.markAllAsRead(userId);
        return res.json({ message: "All notifications marked as read", count });
    } catch (error) {
        console.error("Mark All Read Error:", error);
        return next(new ApiError(500, "An error occurred while marking all notifications as read"));
    }
}

export default {
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
};
