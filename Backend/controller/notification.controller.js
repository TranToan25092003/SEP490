const notificationService = require("../service/notification.service"); // Điều chỉnh đường dẫn nếu cần

class NotificationController {

    async getNotifications(req, res) {
        try {
            const recipientClerkId = req.userId;
            if (!recipientClerkId) {
                return res.status(401).json({ success: false, message: "Unauthorized: User ID not found." });
            }

            // Lấy page và limit từ query params
            const { page, limit, isRead } = req.query;
            
            const result = await notificationService.getNotificationsByRecipient(recipientClerkId, { page, limit, isRead });

            res.status(200).json({
                success: true,
                data: result.notifications,
                pagination: result.pagination,
            });
        } catch (error) {
            console.error("Error fetching notifications:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch notifications.",
            });
        }
    }

    async getUnreadCount(req, res) {
        try {
            const recipientClerkId = req.userId;
            if (!recipientClerkId) {
                return res.status(401).json({ success: false, message: "Unauthorized: User ID not found." });
            }

            const count = await notificationService.getUnreadNotificationCount(recipientClerkId);

            res.status(200).json({
                success: true,
                data: { unreadCount: count },
            });
        } catch (error) {
            console.error("Error fetching unread notification count:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Failed to get unread count.",
            });
        }
    }

    async markAsRead(req, res) {
        try {
            const recipientClerkId = req.userId;
            if (!recipientClerkId) {
                return res.status(401).json({ success: false, message: "Unauthorized: User ID not found." });
            }

            // Lấy mảng notificationIds từ body
            const { notificationIds } = req.body;
            if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
                return res.status(400).json({ success: false, message: "An array of notificationIds is required." });
            }

            const result = await notificationService.markNotificationsAsRead(recipientClerkId, notificationIds);

            res.status(200).json({
                success: true,
                message: `${result.modifiedCount} notifications marked as read.`,
                data: result,
            });
        } catch (error) {
            console.error("Error marking notifications as read:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Failed to mark notifications as read.",
            });
        }
    }
}

module.exports = new NotificationController();