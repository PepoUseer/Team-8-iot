import { useState, useEffect, useRef } from "react";
import { Settings, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { GaugeCard } from "@/components/GaugeCard";
import { GraphsPage } from "@/components/GraphsPage";
import { SettingsModal } from "@/components/SettingsModal";
import { api } from "@/api";

// ── Fallback mock generator (použije se jen když API selže a ještě nemáme žádná data) ──
function generateMockReading(prev) {
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const drift = (val, range) => val + (Math.random() - 0.5) * range;
  return {
    timestamp: Date.now(),
    co2: clamp(drift(prev?.co2 ?? 600, 40), 350, 2000),
    temperature: clamp(drift(prev?.temperature ?? 22, 0.5), 15, 40),
    humidity: clamp(drift(prev?.humidity ?? 50, 2), 20, 90),
    pressure: clamp(drift(prev?.pressure ?? 1013, 1), 950, 1080),
  };
}

const POLL_MS = 10000;

const RANGE_MS = {
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
};

const GRAPH_SAMPLE_COUNT = 50;

// Normalize sensor type string → náš interní klíč
function sensorKey(type) {
  const t = (type || "").toLowerCase();
  if (t === "co2") return "co2";
  if (t === "temperature" || t === "temp") return "temperature";
  if (t === "humidity") return "humidity";
  if (t === "pressure") return "pressure";
  return null;
}

export function DashboardPage({ device, user, onBack, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isGraphs = location.pathname === "/graphs";
  const tab = isGraphs ? "graph" : "current";

  const [graphRange, setGraphRange] = useState("week");
  const [rangeHistory, setRangeHistory] = useState([]);
  const [graphLoading, setGraphLoading] = useState(false);
  const [reading, setReading] = useState(null);
  const [lastUpdated, setLastUpdated] = useState("—");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [limits, setLimits] = useState({
    co2: { min: 350, max: 1000 },
    temperature: { min: 20, max: 26 },
    humidity: { min: 40, max: 60 },
    pressure: { min: 1013, max: 1020 },
  });

  // Sensor id map: { co2: uuid, temperature: uuid, ... }
  // Naplní se při prvním fetchLatest ze sensor_id v odpovědi
  const sensorIds = useRef({});

  // ── Fetch latest readings from backend ─────────────────
  async function fetchLatest() {
    try {
      const data = await api.getDeviceLatest(device.id);
      // data = { device_id, device_name, last_update, readings: [{ sensor_id, type, unit, time, value }] }
      const r = { timestamp: Date.now() };
      for (const s of data.readings || []) {
        const k = sensorKey(s.type);
        if (k) {
          r[k] = parseFloat(s.value);
          // FIX: uložit sensor_id pro pozdější volání graph API
          sensorIds.current[k] = s.sensor_id;
        }
      }
      setReading((prev) => ({ ...(prev ?? {}), ...r }));
      if (data.last_update) {
        setLastUpdated(
          new Date(data.last_update).toLocaleTimeString("cs-CZ", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
      }
    } catch {
      // Pokud API selže, zachovat předchozí data nebo vygenerovat mock
      setReading((prev) => prev ?? generateMockReading(null));
    }
  }

  useEffect(() => {
    setReading(null);
    sensorIds.current = {};
    fetchLatest();
    const id = setInterval(fetchLatest, POLL_MS);
    return () => clearInterval(id);
  }, [device]);

  // ── Graph history — reálné API, fallback na mock ────────
  useEffect(() => {
    if (tab !== "graph") return;

    async function fetchGraphData() {
      setGraphLoading(true);

      // Pokud ještě nemáme sensor ids (fetchLatest ještě neskončil), počkáme
      // a zkusíme to přes krátký timeout; jinak rovnou mock
      const ids = sensorIds.current;
      const hasIds = Object.keys(ids).length > 0;

      if (!hasIds) {
        // Ještě nemáme ids — zobraz mock a po příštím fetchLatest se useEffect znovu spustí
        setRangeHistory(generateMockHistory(graphRange));
        setGraphLoading(false);
        return;
      }

      const end = new Date().toISOString();
      const start = new Date(Date.now() - RANGE_MS[graphRange]).toISOString();

      try {
        // Paralelně fetch pro všechny dostupné sensory
        const keys = ["co2", "temperature", "humidity", "pressure"];
        const results = await Promise.all(
          keys.map((k) =>
            ids[k]
              ? api
                  .getSensorReadings(ids[k], start, end, GRAPH_SAMPLE_COUNT)
                  .then((res) => ({ key: k, data: res.data || [] }))
                  .catch(() => ({ key: k, data: [] }))
              : Promise.resolve({ key: k, data: [] }),
          ),
        );

        // Sloučit do pole { timestamp, co2, temperature, humidity, pressure }
        // Použijeme co2 (nebo první dostupný sensor) jako základ pro timestampy
        const base = results.find((r) => r.data.length > 0);
        if (!base) {
          setRangeHistory(generateMockHistory(graphRange));
          setGraphLoading(false);
          return;
        }

        const merged = base.data.map((point, i) => {
          const entry = { timestamp: new Date(point.time).getTime() };
          for (const { key, data } of results) {
            // Najít nejbližší bod pro stejný index (data jsou stejně dlouhá díky sampleCount)
            entry[key] = data[i] != null ? parseFloat(data[i].value) : null;
          }
          return entry;
        });

        setRangeHistory(merged);
      } catch {
        setRangeHistory(generateMockHistory(graphRange));
      } finally {
        setGraphLoading(false);
      }
    }

    fetchGraphData();
  }, [graphRange, device, tab]);

  // Re-fetch graph když se naplní sensorIds (po prvním fetchLatest)
  const prevSensorIdsRef = useRef({});
  useEffect(() => {
    if (tab !== "graph") return;
    const prev = prevSensorIdsRef.current;
    const curr = sensorIds.current;
    const wasEmpty = Object.keys(prev).length === 0;
    const nowHas = Object.keys(curr).length > 0;
    if (wasEmpty && nowHas) {
      prevSensorIdsRef.current = { ...curr };
      // Trigger graph refetch — změníme graphRange na sebe sama přes dočasný stav
      setGraphRange((r) => r);
    }
  }, [reading, tab]);

  const statusColor = (val, { min, max }) => {
    if (val == null) return "rgba(255,255,255,0.2)";
    if (val < min || val > max) return "#ef4444";
    const margin = (max - min) * 0.1;
    if (val < min + margin || val > max - margin) return "#f97316";
    return "#22c55e";
  };

  // Current reading with safe fallbacks
  const r = reading ?? {};

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* ── Nav tabs row ── */}
      <div className="ab-nav-tabs">
        <span className="ab-logo ab-logo-inline">Air Buddy</span>

        <button
          className={`ab-nav-tab ${tab === "current" ? "active" : ""}`}
          onClick={() => navigate("/dashboard")}
        >
          current values
        </button>
        <button
          className={`ab-nav-tab ${tab === "graph" ? "active" : ""}`}
          onClick={() => navigate("/graphs")}
        >
          values in graph
        </button>

        {user && (
          <div style={{ position: "relative", marginLeft: "auto" }}>
            <button
              className="ab-user-avatar"
              onClick={() => setMenuOpen((o) => !o)}
              title={user.email}
            >
              <User size={22} />
            </button>

            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "52px",
                  background: "#434446",
                  borderRadius: "10px",
                  minWidth: "180px",
                  padding: "8px 0",
                  zIndex: 50,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                }}
              >
                <div
                  style={{
                    padding: "8px 16px 10px",
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    color: "var(--ab-placeholder)",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  {user.email}
                </div>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout && onLogout();
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    background: "none",
                    border: "none",
                    color: "var(--ab-text)",
                    fontFamily: "var(--font-body)",
                    fontSize: "15px",
                    fontWeight: 600,
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Device title row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 24px 0",
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "22px",
              fontWeight: 700,
              color: "var(--ab-text)",
            }}
          >
            {device.name}
          </h2>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "15px",
              color: "var(--ab-placeholder)",
            }}
          >
            last updated at {lastUpdated} &nbsp;
            <span
              style={{
                color:
                  device.status === "online"
                    ? "var(--ab-online)"
                    : "var(--ab-offline)",
              }}
            >
              {device.status}
            </span>
          </p>
        </div>

        {/* Buttons — both same height (36px) */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={onBack}
            style={{
              background: "var(--ab-cancel)",
              border: "none",
              borderRadius: 8,
              height: 36,
              padding: "0 14px",
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              fontWeight: 600,
              color: "#3C3D3E",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            change device
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            style={{
              background: "var(--ab-cancel)",
              border: "none",
              borderRadius: 8,
              height: 36,
              width: 36,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#3C3D3E",
              flexShrink: 0,
            }}
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* ── Current values tab ── */}
      {tab === "current" && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 28,
            padding: "20px 24px 24px",
            justifyContent: "center",
          }}
        >
          <GaugeCard
            label="CO2 concentration"
            value={r.co2 != null ? r.co2.toFixed(0) : "—"}
            unit="ppm"
            color={statusColor(r.co2, limits.co2)}
            max={2000}
            current={r.co2 ?? 0}
          />
          <GaugeCard
            label="Temperature"
            value={r.temperature != null ? r.temperature.toFixed(1) : "—"}
            unit="°C"
            color={statusColor(r.temperature, limits.temperature)}
            max={50}
            current={r.temperature ?? 0}
          />
          <GaugeCard
            label="Humidity"
            value={r.humidity != null ? r.humidity.toFixed(1) : "—"}
            unit="%"
            color={statusColor(r.humidity, limits.humidity)}
            max={100}
            current={r.humidity ?? 0}
          />
          <GaugeCard
            label="Barometric pressure"
            value={r.pressure != null ? r.pressure.toFixed(0) : "—"}
            unit="hPa"
            color={statusColor(r.pressure, limits.pressure)}
            max={1100}
            current={r.pressure ?? 0}
          />
        </div>
      )}

      {/* ── Graph tab ── */}
      {tab === "graph" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              padding: "12px 24px 0",
              gap: 8,
            }}
          >
            {["day", "week", "month"].map((range) => (
              <button
                key={range}
                onClick={() => setGraphRange(range)}
                style={{
                  background:
                    graphRange === range
                      ? "var(--ab-accent)"
                      : "var(--ab-cancel)",
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 14px",
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: graphRange === range ? "#000" : "var(--ab-text-dim)",
                  cursor: "pointer",
                }}
              >
                {range}
              </button>
            ))}
          </div>

          {graphLoading ? (
            <div
              style={{
                padding: "48px 24px",
                textAlign: "center",
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                color: "var(--ab-text-dim)",
              }}
            >
              Loading…
            </div>
          ) : (
            <GraphsPage history={rangeHistory} graphRange={graphRange} />
          )}
        </div>
      )}

      {settingsOpen && (
        <SettingsModal
          device={device}
          limits={limits}
          sensorIds={sensorIds.current}
          onSave={(newLimits, newName) => {
            setLimits(newLimits);
            setSettingsOpen(false);
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}

// ── Mock fallback pro grafy (když API není dostupné) ───────
function generateMockHistory(graphRange) {
  const MOCK_POINTS = 40;
  const windowMs = RANGE_MS[graphRange];
  const step = windowMs / (MOCK_POINTS - 1);
  const pts = [];
  let r = { co2: 600, temperature: 22, humidity: 50, pressure: 1013 };
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const drift = (val, range) => val + (Math.random() - 0.5) * range;
  for (let i = 0; i < MOCK_POINTS; i++) {
    r = {
      timestamp: Date.now() - windowMs + i * step,
      co2: clamp(drift(r.co2, 40), 350, 2000),
      temperature: clamp(drift(r.temperature, 0.5), 15, 40),
      humidity: clamp(drift(r.humidity, 2), 20, 90),
      pressure: clamp(drift(r.pressure, 1), 950, 1080),
    };
    pts.push({ ...r });
  }
  return pts;
}
