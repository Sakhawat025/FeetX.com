const prisma = require("../config/prisma");

// Get logged-in user's notifications
const getMyNotifications = async (userId) => {
  return await prisma.notification.findMany({
    where: { userId: userId },
    orderBy: { createdAt: "desc" }
  });
};

// Get unread notification count
const getUnreadCount = async (userId) => {
  return await prisma.notification.count({
    where: { userId: userId, read: false }
  });
};

// Mark one notification as read
const markAsRead = async (notificationId, userId) => {
  return await prisma.notification.updateMany({
    where: { id: notificationId, userId: userId },
    data: { read: true }
  });
};

// Create a notification
const createNotification = async ({ userId, title, message, type = "INFO" }) => {
  return await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      read: false
    }
  });
};


// Mark all notifications as read
const markAllAsRead = async (userId) => {
  return await prisma.notification.updateMany({
    where: { userId: userId, read: false },
    data: { read: true }
  });
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification
};
