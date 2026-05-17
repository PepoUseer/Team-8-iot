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
    method === "GET" && body ? `?${new URLSearchParams(body).toString()}` : "";

  const res = await fetch(`${BASE}/${path}${query}`, options);

  if (!res.ok) {
    let msg = "Request failed";
    try {
      const errData = await res.json();
      msg = errData?.error?.message || errData?.message || msg;
    } catch {
      msg = (await res.text()) || msg;
    }
    throw new Error(msg);
  }

  return res.status === 204 ? null : res.json();
};

const api = {
  login: (email, password) =>
    request("POST", "auth/login", { email, password }),

  register: (username, email, password) =>
    request("POST", "auth/register", { username, email, password }),

  getDevices: () => request("GET", "devices"),

  getDevice: (id) => request("GET", `devices/${id}`),

  getDeviceLatest: (deviceId) => request("GET", `devices/${deviceId}/latest`),

  createDevice: (deviceId, name) =>
    request("POST", "devices/add", {
      id: deviceId,
      name,
    }),

  updateDevice: (id, data) => request("PATCH", `devices/${id}`, data),

  deleteDevice: (id) => request("DELETE", `devices/${id}`),

  getDeviceSensors: (deviceId) => request("GET", `devices/${deviceId}/sensors`),

  updateSensor: (sensorId, data) =>
    request("PATCH", `sensors/${sensorId}`, data),

  getSensorReadings: (sensorId, start, end, sampleCount = 50) =>
    request("GET", `sensors/${sensorId}/readings`, {
      start,
      end,
      sampleCount,
    }),
};

export { api };
