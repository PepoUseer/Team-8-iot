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

// ── Mock zařízení ─────────────────────────────────────────
//
// Toto zařízení se zobrazí v seznamu zařízení vedle reálných.
// CO2 je záměrně nad limitem (1200 ppm > max 1000) → spustí alert + zvuk.
//
const MOCK_DEVICE_ID = "mock-demo-device-001";

const MOCK_DEVICE = {
  device_id: MOCK_DEVICE_ID,
  device_name: "Demo kancelář",
  last_update: new Date().toISOString(), // "online"
};

const MOCK_SENSORS = [
  {
    sensor_id: "mock-s-co2",
    device_id: MOCK_DEVICE_ID,
    sensor_type: "co2",
    unit: "ppm",
    threshold_min: 350,
    threshold_max: 1000,
  },
  {
    sensor_id: "mock-s-temperature",
    device_id: MOCK_DEVICE_ID,
    sensor_type: "temperature",
    unit: "°C",
    threshold_min: 20,
    threshold_max: 26,
  },
  {
    sensor_id: "mock-s-humidity",
    device_id: MOCK_DEVICE_ID,
    sensor_type: "humidity",
    unit: "%",
    threshold_min: 40,
    threshold_max: 60,
  },
  {
    sensor_id: "mock-s-pressure",
    device_id: MOCK_DEVICE_ID,
    sensor_type: "pressure",
    unit: "hPa",
    threshold_min: 1000,
    threshold_max: 1020,
  },
];

// Aktuální hodnoty — CO2 nad limitem záměrně
const MOCK_LATEST_READINGS = [
  {
    sensor_id: "mock-s-co2",
    type: "co2",
    unit: "ppm",
    value: "1247",
    time: new Date().toISOString(),
  },
  {
    sensor_id: "mock-s-temperature",
    type: "temperature",
    unit: "°C",
    value: "23.4",
    time: new Date().toISOString(),
  },
  {
    sensor_id: "mock-s-humidity",
    type: "humidity",
    unit: "%",
    value: "55",
    time: new Date().toISOString(),
  },
  {
    sensor_id: "mock-s-pressure",
    type: "pressure",
    unit: "hPa",
    value: "1013",
    time: new Date().toISOString(),
  },
];

// Generátor historických dat pro grafy
function generateMockReadings(sensorId, days, baseValue, amplitude, noiseAmp) {
  const now = Date.now();
  const points = 50;
  const rangeMs = days * 24 * 60 * 60 * 1000;
  const data = [];

  for (let i = 0; i < points; i++) {
    const t = now - rangeMs + (rangeMs / (points - 1)) * i;
    // Sinusová vlna + náhoda = realistický průběh
    const wave = Math.sin((i / points) * Math.PI * 4) * amplitude;
    const noise = (Math.random() - 0.5) * noiseAmp;
    // Poslední bod záměrně nad limitem pro CO2
    const isCo2 = sensorId === "mock-s-co2";
    const spike = isCo2 && i >= points - 5 ? 300 + Math.random() * 100 : 0;
    data.push({
      time: new Date(t).toISOString(),
      value: String((baseValue + wave + noise + spike).toFixed(1)),
    });
  }
  return data;
}

const MOCK_GRAPH_DATA = {
  "mock-s-co2": { base: 700, amp: 150, noise: 50 },
  "mock-s-temperature": { base: 23, amp: 2, noise: 0.5 },
  "mock-s-humidity": { base: 52, amp: 8, noise: 2 },
  "mock-s-pressure": { base: 1011, amp: 4, noise: 1 },
};

// ── Mock interceptor ──────────────────────────────────────
function isMockDevice(id) {
  return id === MOCK_DEVICE_ID;
}

function isMockSensor(id) {
  return id && id.startsWith("mock-s-");
}

function mockGetDevices(realData) {
  const mockEntry = {
    id: MOCK_DEVICE_ID,
    device_id: MOCK_DEVICE_ID,
    device_name: MOCK_DEVICE.device_name,
    last_update: MOCK_DEVICE.last_update,
  };
  // Přidáme mock zařízení na začátek seznamu
  return {
    devices: [MOCK_DEVICE, ...(realData?.devices ?? [])],
  };
}

// ── API objekt ────────────────────────────────────────────
const api = {
  login: (email, password) =>
    request("POST", "auth/login", { email, password }),

  register: (username, email, password) =>
    request("POST", "auth/register", { username, email, password }),

  getDevices: async () => {
    try {
      const real = await request("GET", "devices");
      return mockGetDevices(real);
    } catch {
      return mockGetDevices({ devices: [] });
    }
  },

  getDevice: (id) => {
    if (isMockDevice(id)) {
      return Promise.resolve(MOCK_DEVICE);
    }
    return request("GET", `devices/${id}`);
  },

  getDeviceLatest: (deviceId) => {
    if (isMockDevice(deviceId)) {
      return Promise.resolve({
        ...MOCK_DEVICE,
        readings: MOCK_LATEST_READINGS,
      });
    }
    return request("GET", `devices/${deviceId}/latest`);
  },

  createDevice: (deviceId, name) =>
    request("POST", "devices/add", {
      id: deviceId,
      name,
    }),

  updateDevice: (id, data) => {
    if (isMockDevice(id)) {
      return Promise.resolve({
        device_id: id,
        device_name: data.deviceName ?? MOCK_DEVICE.device_name,
      });
    }
    return request("PATCH", `devices/${id}`, data);
  },

  deleteDevice: (id) => {
    if (isMockDevice(id)) return Promise.resolve(null);
    return request("DELETE", `devices/${id}`);
  },

  getDeviceSensors: (deviceId) => {
    if (isMockDevice(deviceId)) {
      return Promise.resolve(MOCK_SENSORS);
    }
    return request("GET", `devices/${deviceId}/sensors`);
  },

  updateSensor: (sensorId, data) => {
    if (isMockSensor(sensorId)) return Promise.resolve(null);
    return request("PATCH", `sensors/${sensorId}`, data);
  },

  getSensorReadings: (sensorId, start, end, sampleCount = 50) => {
    if (isMockSensor(sensorId)) {
      const cfg = MOCK_GRAPH_DATA[sensorId];
      const startMs = new Date(start).getTime();
      const endMs = new Date(end).getTime();
      const days = (endMs - startMs) / (1000 * 60 * 60 * 24);
      const data = generateMockReadings(
        sensorId,
        days,
        cfg.base,
        cfg.amp,
        cfg.noise,
      );
      return Promise.resolve({ id: sensorId, data });
    }
    return request("GET", `sensors/${sensorId}/readings`, {
      start,
      end,
      sampleCount,
    });
  },
};

export { api };
