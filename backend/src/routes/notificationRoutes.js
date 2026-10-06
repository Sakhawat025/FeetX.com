const express = require("express");
const router = express.Router();
const {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
} = require("../controllers/notificationController");
const authMiddleware = require("../middleware/authMiddleware");

// Get my notifications
router.get("/", authMiddleware, getMyNotifications);

// Get unread count
router.get("/unread-count", authMiddleware, getUnreadCount);

// Mark all as read
router.patch("/read-all", authMiddleware, markAllAsRead);

// Mark one as read
router.patch("/:id/read", authMiddleware, markAsRead);

module.exports = router;
