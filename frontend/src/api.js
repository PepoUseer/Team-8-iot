// ── API base URL ──────────────────────────────────────────
const BASE = import.meta.env.API_URL || "http://localhost:4000";;

async function request(method, path, body) {
  const opts = {
    method,
    credentials: "include", // send session cookie
    headers: { "Content-Type": "application/json" },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}/${path}`, opts);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.error?.message || data?.message || `Error ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// ── Auth ──────────────────────────────────────────────────
export const api = {
  register: (username, email, password) =>
    request("POST", "auth/register", { username, email, password }),

  login: (email, password) =>
    request("POST", "auth/login", { email, password }),

  // ── Devices ────────────────────────────────────────────
  getDevices: () => request("GET", "devices"),

  addDevice: (id) => request("POST", "devices/add", { id }),

  getDeviceLatest: (deviceId) => request("GET", `devices/${deviceId}/latest`),

  // ── Sensors ────────────────────────────────────────────
  getSensorReadings: (sensorId, start, end, sampleCount) =>
    request(
      "GET",
      `sensors/${sensorId}/readings?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&sampleCount=${sampleCount ?? 0}`,
    ),
};
