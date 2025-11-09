const express = require("express");
const notificationController = require("../controller/notification.controller");
const { authenticate } = require("../middleware/guards/authen.middleware");

const router = new express.Router();

router.get("/", authenticate, notificationController.getNotifications);
router.get("/unread-count", authenticate, notificationController.getUnreadCount);
router.patch("/mark-as-read", authenticate, notificationController.markAsRead);

module.exports = router;