import api from "./api";

export async function getVehicles() {
  const response = await api.get("/admin/vehicles");
  return response.data;
}

export async function saveVehicle(id, data) {
  const response = id
    ? await api.put(`/admin/vehicles/${id}`, data)
    : await api.post("/admin/vehicles", data);

  return response.data;
}