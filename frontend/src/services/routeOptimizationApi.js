import api from "./api";

export async function getRouteOptimization(riderId, signal) {
  const response = await api.get("/admin/route-optimization", {
    params: riderId ? { riderId } : {},
    signal,
    timeout: 20000,
  });

  return response.data;
}

export async function reorderStops(riderId, stopOrder) {
  const response = await api.post(
    "/admin/route-optimization/reorder",
    { riderId, stopOrder },
    { timeout: 15000 }
  );

  return response.data;
}

