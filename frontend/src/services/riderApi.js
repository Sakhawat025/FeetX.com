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