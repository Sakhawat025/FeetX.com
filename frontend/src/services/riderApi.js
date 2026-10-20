import api from "./api";

export const getRiderDashboardStats = async () => {
    const response = await api.get("/rider/dashboard-stats");
    return response.data;
};

export const getCurrentTask = async () => {
    const response = await api.get("/rider/current-task");
    return response.data;
};

export const getAssignedDeliveries = async () => {
    const response = await api.get("/rider/assigned-deliveries");
    return response.data;
};

export const updateDeliveryStatus = async (deliveryId, status, expectedStatus) => {
  const response = await api.patch(
    `/rider/deliveries/${deliveryId}/status`,
    {
      status,
      expectedStatus,
    }
  );
  return response.data;
};

export const getRiderProfile = async () => {
  const response = await api.get("/rider/profile");
  return response.data;
};

export const updateRiderProfile = async (data) => {
  const response = await api.patch("/rider/profile", data);
  return response.data;
};