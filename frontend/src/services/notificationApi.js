import api from "./api";

export const getUnreadCount = async () => {
  const response = await api.get("/notifications/unread-count");
  return response.data;
};