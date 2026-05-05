import { useState, useEffect, useRef } from "react";
import { Settings, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { GaugeCard } from "@/components/GaugeCard";
import { GraphsPage } from "@/components/GraphsPage";
import { SettingsModal } from "@/components/SettingsModal";
import { api } from "@/api";

// ── Fallback mock generator (used only when no real sensor ids available) ──
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

// Normalize sensor type string → our internal key
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
  const sensorIds = useRef({});

  // ── Fetch latest readings from backend ─────────────────
  async function fetchLatest() {
    try {
      const data = await api.getDeviceLatest(device.id);
      // data = { device_id, last_update, readings: [{ type, value, unit }] }
      const r = { timestamp: Date.now() };
      for (const s of data.readings || []) {
        const k = sensorKey(s.type);
        if (k) r[k] = parseFloat(s.value);
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
      // If API fails, keep previous / mock values
      setReading((prev) => prev ?? generateMockReading(null));
    }
  }

  useEffect(() => {
    setReading(null);
    fetchLatest();
    const id = setInterval(fetchLatest, POLL_MS);
    return () => clearInterval(id);
  }, [device]);

  // ── Graph history (mock until sensor readings endpoint wired per-chart) ──
  useEffect(() => {
    const MOCK_POINTS = 40;
    const windowMs = RANGE_MS[graphRange];
    const step = windowMs / (MOCK_POINTS - 1);
    const pts = [];
    let r = { co2: 600, temperature: 22, humidity: 50, pressure: 1013 };
    for (let i = 0; i < MOCK_POINTS; i++) {
      r = generateMockReading(r);
      pts.push({ ...r, timestamp: Date.now() - windowMs + i * step });
    }
    setRangeHistory(pts);
  }, [graphRange, device]);

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
          {/* Settings button — same height as "change device" */}
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

          <GraphsPage history={rangeHistory} graphRange={graphRange} />
        </div>
      )}

      {settingsOpen && (
        <SettingsModal
          device={device}
          limits={limits}
          onSave={(newLimits) => {
            setLimits(newLimits);
            setSettingsOpen(false);
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
