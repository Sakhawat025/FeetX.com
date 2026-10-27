import api from "./api";

export async function getRouteOptimization(riderId, signal) {
  const response = await api.get(
    "/admin/route-optimization",
    {
      params: riderId ? { riderId } : {},
      signal,
      timeout: 30000,
    }
  );

  return response.data;
}

// Example stopOrder:
// ["pickup:12", "delivery:15", "delivery:12"]
export async function reorderStops(
  riderId,
  stopOrder,
  signal
) {
  const response = await api.post(
    "/admin/route-optimization/reorder",
    {
      riderId,
      stopOrder,
    },
    {
      signal,
      timeout: 30000,
    }
  );

  return response.data;
}