import api from "./api";

export async function getAdminSettings(signal) {
  const response = await api.get("/admin/settings", {
    signal,
    timeout: 15000,
  });

  return response.data;
}

export async function saveAdminSettings(
  settings,
  signal
) {
  const response = await api.put(
    "/admin/settings",
    settings,
    {
      signal,
      timeout: 15000,
    }
  );

  // Update the mounted Admin sidebar after a successful save.
  window.dispatchEvent(
    new CustomEvent("fleetx:settings-saved", {
      detail: response.data,
    })
  );

  return response.data;
}