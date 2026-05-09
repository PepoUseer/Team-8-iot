// ── API base URL ──────────────────────────────────────────
const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

const request = async (method, path, body) => {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  };

  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  const query =
    method === "GET" && body
      ? `?${new URLSearchParams(body).toString()}`
      : "";

  const res = await fetch(`/api/${path}${query}`, options);

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.status === 204 ? null : res.json();
};

const api = {
  login: (email, password) =>
    request("POST", "auth/login", { email, password }),

  register: (email, password) =>
    request("POST", "auth/register", { email, password }),

  getDevices: () => request("GET", "devices"),

  getDevice: (id) => request("GET", `devices/${id}`),

  createDevice: (deviceId) =>
    request("POST", "devices/add", { id: deviceId }),

  updateDevice: (id, data) =>
    request("PATCH", `devices/${id}`, data),

  deleteDevice: (id) =>
    request("DELETE", `devices/${id}`),

  getDeviceSensors: (deviceId) =>
    request("GET", `devices/${deviceId}/sensors`),

  updateSensor: (sensorId, data) =>
    request("PATCH", `sensors/${sensorId}`, data),

  getSensorReadings: (sensorId, start, end, sampleCount = 50) =>
    request("GET", `sensors/${sensorId}/readings`, {
      start,
      end,
      sampleCount,
    }),
};

export default api;