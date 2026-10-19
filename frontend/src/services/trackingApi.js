import api from "./api";

const options = {
  timeout: 12000,
};

export async function startLocationSession() {
  const response = await api.post(
    "/tracking/session",
    {},
    options
  );

  return response.data;
}

export async function stopLocationSession(sessionId) {
  const response = await api.delete("/tracking/session", {
    ...options,
    data: { sessionId },
  });

  return response.data;
}

export async function sendRiderLocation(data) {
  const response = await api.put(
    "/tracking/location",
    data,
    options
  );

  return response.data;
}

export async function getTracking(url) {
  const response = await api.get(url, options);
  return response.data;
}