import { useState, useEffect, useRef } from "react";
import { Settings } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { GaugeCard } from "@/components/GaugeCard";
import { GraphsPage } from "@/components/GraphsPage";
import { SettingsModal } from "@/components/SettingsModal";

// ── Mock data generator ─────────────────────────────────
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

const POLL_MS = 5000; // refresh every 5 s (swap for real API)

// ── Range → milliseconds map ────────────────────────────
const RANGE_MS = {
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
};

export function DashboardPage({ device, user, onBack }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Derive active tab from the current route
  const isGraphs = location.pathname === "/graphs";
  const tab = isGraphs ? "graph" : "current";

  const [graphRange, setGraphRange] = useState("week"); // "day" | "week" | "month"

  const [rangeHistory, setRangeHistory] = useState([]);

  const [reading, setReading] = useState(generateMockReading(null));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [limits, setLimits] = useState({
    co2: { min: 350, max: 1000 },
    temperature: { min: 20, max: 26 },
    humidity: { min: 40, max: 60 },
    pressure: { min: 1013, max: 1020 },
  });

  const intervalRef = useRef(null);

  // ── Live polling (current values tab only) ─────────────
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setReading((prev) => generateMockReading(prev));
    }, POLL_MS);
    return () => clearInterval(intervalRef.current);
  }, [device]);

  // ── Range-based history fetch ───────────────────────────
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

  const lastUpdated = new Date(reading.timestamp).toLocaleTimeString("cs-CZ", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Colour status: green if within limits, orange if near edge, red if over
  const statusColor = (val, { min, max }) => {
    if (val < min || val > max) return "#ef4444";
    const margin = (max - min) * 0.1;
    if (val < min + margin || val > max - margin) return "#f97316";
    return "#22c55e";
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* Nav tabs row — no user avatar here, it lives only in the Header */}
      <div className="ab-nav-tabs">
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
              fontSize: "12px",
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

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={onBack}
            style={{
              background: "var(--ab-cancel)",
              border: "none",
              borderRadius: 8,
              padding: "6px 14px",
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              fontWeight: 600,
              color: "#3C3D3E",
              cursor: "pointer",
            }}
          >
            change device
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            style={{
              background: "none",
              border: "none",
              color: "var(--ab-text-dim)",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Settings size={22} />
          </button>
        </div>
      </div>

      {/* ── Current values tab ── */}
      {tab === "current" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 16,
            padding: "20px 24px 24px",
          }}
        >
          <GaugeCard
            label="CO2 concentration"
            value={reading.co2.toFixed(0)}
            unit="ppm"
            color={statusColor(reading.co2, limits.co2)}
            max={2000}
            current={reading.co2}
          />
          <GaugeCard
            label="Temperature"
            value={reading.temperature.toFixed(1)}
            unit="°C"
            color={statusColor(reading.temperature, limits.temperature)}
            max={50}
            current={reading.temperature}
          />
          <GaugeCard
            label="Humidity"
            value={reading.humidity.toFixed(1)}
            unit="%"
            color={statusColor(reading.humidity, limits.humidity)}
            max={100}
            current={reading.humidity}
          />
          <GaugeCard
            label="Barometric pressure"
            value={reading.pressure.toFixed(0)}
            unit="hPa"
            color={statusColor(reading.pressure, limits.pressure)}
            max={1100}
            current={reading.pressure}
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
            {["day", "week", "month"].map((r) => (
              <button
                key={r}
                onClick={() => setGraphRange(r)}
                style={{
                  background:
                    graphRange === r ? "var(--ab-accent)" : "var(--ab-cancel)",
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 14px",
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: graphRange === r ? "#000" : "var(--ab-text-dim)",
                  cursor: "pointer",
                }}
              >
                {r}
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
