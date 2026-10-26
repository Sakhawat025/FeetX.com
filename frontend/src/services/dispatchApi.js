import api from "./api";

export async function getSmartDispatch(deliveryId, signal) {
  const response = await api.get("/admin/smart-dispatch", {
    params: deliveryId ? { deliveryId } : {},
    signal,
    timeout: 20000,
  });

  return response.data;
}

export async function assignSmartRider(deliveryId, riderId) {
  const response = await api.patch(
    `/admin/deliveries/${deliveryId}/assign`,
    { riderId },
    { timeout: 20000 }
  );

  return response.data;
}
