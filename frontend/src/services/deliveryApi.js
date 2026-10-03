import api from "./api";

// Create new delivery
export const createDelivery = async (data) => {
    const response = await api.post("/deliveries", data);
    return response.data;
};

// Get logged in customer deliveries
export const getMyDeliveries = async () => {
    const response = await api.get("/deliveries/my");
    return response.data;
};
