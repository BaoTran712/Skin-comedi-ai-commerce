import Notification from "../models/notification.model.js";

class NotificationService {
    async create(payload) {
        return await this.createNotification(payload);
    }

    async createNotification(payload) {
        try {
            const notification = new Notification({
                user_id: payload.user_id,
                type: payload.type || "SYSTEM",
                title: payload.title,
                message: payload.message,
                referenceId: payload.referenceId || null,
                link: payload.link || "/ordercheck",
            });
            return await notification.save();
        } catch (error) {
            console.error("Error creating notification:", error);
            // Don't throw error to prevent breaking main workflow
            return null;
        }
    }

    async getUserNotifications(userId, limit = 20) {
        return await Notification.find({ user_id: userId })
            .sort({ createdAt: -1 })
            .limit(limit);
    }

    async getUnreadCount(userId) {
        return await Notification.countDocuments({ user_id: userId, isRead: false });
    }

    async markAsRead(notificationId, userId) {
        return await Notification.findOneAndUpdate(
            { _id: notificationId, user_id: userId },
            { $set: { isRead: true } },
            { new: true }
        );
    }

    async markAllAsRead(userId) {
        const result = await Notification.updateMany(
            { user_id: userId, isRead: false },
            { $set: { isRead: true } }
        );
        return result.modifiedCount;
    }
}

export default NotificationService;
