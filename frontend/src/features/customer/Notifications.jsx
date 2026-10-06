import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../services/notificationApi";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await getMyNotifications();
      setNotifications(data || []);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading(true);
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          read: true,
        }))
      );
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <div className="min-h-screen bg-[#fffaf3] px-6 py-8 lg:px-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-2 text-gray-500">Stay updated with your delivery notifications.</p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={actionLoading}
            className="flex items-center gap-2 rounded-xl border border-orange-500 bg-white px-4 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-50 disabled:opacity-50"
          >
            <CheckCheck size={17} />
            {actionLoading ? "Marking..." : "Mark all as read"}
          </button>
        )}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
          <p className="text-gray-500">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50">
              <Bell size={24} className="text-orange-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">No new notifications</h2>
              <p className="mt-1 text-sm text-gray-500">You're all caught up.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <button
              type="button"
              key={notification.id}
              onClick={() => {
                if (!notification.read) {
                  handleMarkAsRead(notification.id);
                }
              }}
              className={`w-full rounded-2xl border p-6 text-left shadow-sm transition ${
                notification.read
                  ? "border-orange-100 bg-white"
                  : "border-orange-200 bg-orange-50/40"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                  <Bell size={24} className="text-orange-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className={`font-semibold ${notification.read ? "text-gray-700" : "text-gray-900"}`}>
                      {notification.title}
                    </h2>
                    {!notification.read && (
                      <span className="shrink-0 rounded-full bg-orange-500 px-2.5 py-1 text-xs font-semibold text-white">
                        New
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {notification.message}
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default Notifications;
