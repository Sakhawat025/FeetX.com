import api from "./api";

export async function getAdminParcels(params, signal) {
  const response = await api.get("/admin/parcels", {
    params,
    signal,
  });

  return response.data;
}

export async function getAdminParcel(id, signal) {
  const response = await api.get(`/admin/parcels/${id}`, {
    signal,
  });

  return response.data;
}

export async function updateParcelPriority(id, priority) {
  const response = await api.patch(
    `/admin/parcels/${id}/priority`,
    { priority }
  );

  return response.data;
}