import api from "./api";

export const getDashboardStats = async () => {
  const response = await api.get("/admin/dashboard-stats");
  return response.data;
};

export const getLiveRiders = async () => {
  const response = await api.get("/admin/live-riders");
  return response.data;
};

export const getDailyDeliveryPerformance = async () => {
    const response = await api.get("/admin/daily-delivery-performance");
    return response.data;
};
export const getPendingAssignments = async () => {
    const response = await api.get("/admin/pending-assignments");
    return response.data;
};

export const assignDeliveryRider = async (deliveryId, riderId) => {
  const response = await api.patch(
    `/admin/deliveries/${deliveryId}/assign`,
    { riderId: Number(riderId) }
  );
  return response.data;
};

export const getAdminRiders = async () => {
  const response = await api.get("/admin/riders");
  return response.data;
};

export const createAdminRider = async (data) => {
  const response = await api.post("/admin/riders", data);
  return response.data;
};

export const updateAdminRider = async (id, data) => {
  const response = await api.patch(`/admin/riders/${id}`, data);
  return response.data;
};
