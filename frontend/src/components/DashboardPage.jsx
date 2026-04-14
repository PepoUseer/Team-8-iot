import { useState, useEffect, useRef } from "react";
import { Settings, User } from "lucide-react";
import { GaugeChart } from "@/components/GaugeChart";
import { LineGraph } from "@/components/LineGraph";
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

const HISTORY_MAX = 50; // keep last 50 readings in graph
const POLL_MS = 5000; // refresh every 5 s (swap for real API)

export function DashboardPage({ device, user, onBack }) {
  const [tab, setTab] = useState("current"); // "current" | "graph"
  const [graphRange, setGraphRange] = useState("week"); // "day" | "week" | "month"
  const [reading, setReading] = useState(generateMockReading(null));
  const [history, setHistory] = useState(() => {
    // Pre-populate graph with 20 fake points
    const pts = [];
    let r = { co2: 600, temperature: 22, humidity: 50, pressure: 1013 };
    for (let i = 0; i < 20; i++) {
      r = generateMockReading(r);
      pts.push({ ...r, timestamp: Date.now() - (20 - i) * POLL_MS });
    }
    return pts;
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [limits, setLimits] = useState({
    co2: { min: 350, max: 1000 },
    temperature: { min: 20, max: 26 },
    humidity: { min: 40, max: 60 },
    pressure: { min: 1013, max: 1020 },
  });

  const intervalRef = useRef(null);

  // Polling (replace fetch mock with real API call)
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setReading((prev) => {
        const next = generateMockReading(prev);
        setHistory((h) => [...h.slice(-HISTORY_MAX + 1), next]);
        return next;
      });
    }, POLL_MS);
    return () => clearInterval(intervalRef.current);
  }, [device]);

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

  // Get initials from email for avatar
  const getInitials = (email) => {
    if (!email) return null;
    const local = email.split("@")[0];
    return local.slice(0, 2).toUpperCase();
  };

  const initials = user ? getInitials(user.email) : null;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* Nav tabs row */}
      <div className="ab-nav-tabs" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex" }}>
          <button
            className={`ab-nav-tab ${tab === "current" ? "active" : ""}`}
            onClick={() => setTab("current")}
          >
            current values
          </button>
          <button
            className={`ab-nav-tab ${tab === "graph" ? "active" : ""}`}
            onClick={() => setTab("graph")}
          >
            values in graph
          </button>
        </div>

        {/* User avatar with initials or icon */}
        <div
          title={user?.email}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.25)",
            background: "var(--ab-card)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--ab-text-dim)",
            fontSize: "13px",
            fontWeight: 700,
            fontFamily: "var(--font-body)",
            userSelect: "none",
            flexShrink: 0,
          }}
        >
          {initials ? (
            <span
              style={{
                color: "var(--ab-text)",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {initials}
            </span>
          ) : (
            <User size={18} />
          )}
        </div>
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
          <div className="ab-graph-grid">
            <LineGraph
              title="CO2 concentration"
              data={history}
              field="co2"
              unit="ppm"
              color="#f97316"
            />
            <LineGraph
              title="Temperature"
              data={history}
              field="temperature"
              unit="°C"
              color="#3b82f6"
            />
            <LineGraph
              title="Humidity"
              data={history}
              field="humidity"
              unit="%"
              color="#ef4444"
            />
            <LineGraph
              title="Barometric pressure"
              data={history}
              field="pressure"
              unit="hPa"
              color="#22c55e"
            />
          </div>
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

/* ── Gauge card with SVG arc ─────────────────────────── */
function GaugeCard({ label, value, unit, color, max, current }) {
  const pct = Math.min(current / max, 1);
  // Arc params
  const r = 52,
    cx = 64,
    cy = 64;
  const startAngle = -210,
    endAngle = 30; // degrees
  const toRad = (d) => (d * Math.PI) / 180;
  const arc = (a) => [cx + r * Math.cos(toRad(a)), cy + r * Math.sin(toRad(a))];
  const totalAngle = endAngle - startAngle; // 240
  const currentAngle = startAngle + totalAngle * pct;

  const [sx, sy] = arc(startAngle);
  const [ex, ey] = arc(currentAngle);
  const largeArc = totalAngle * pct > 180 ? 1 : 0;

  // Track arc (grey)
  const [tsx, tsy] = arc(startAngle);
  const [tex, tey] = arc(endAngle);

  return (
    <div className="ab-gauge-card">
      <span className="ab-gauge-label">{label}</span>
      <svg
        width="128"
        height="90"
        viewBox="0 0 128 90"
        style={{ overflow: "visible" }}
      >
        {/* Track */}
        <path
          d={`M ${tsx} ${tsy} A ${r} ${r} 0 1 1 ${tex} ${tey}`}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Progress */}
        {pct > 0 && (
          <path
            d={`M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey}`}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
          />
        )}
        <text
          x={cx}
          y={cy + 6}
          textAnchor="middle"
          fill="#fff"
          fontSize="20"
          fontWeight="700"
          fontFamily="var(--font-body)"
        >
          {value}
        </text>
        <text
          x={cx}
          y={cy + 22}
          textAnchor="middle"
          fill="var(--ab-placeholder)"
          fontSize="11"
          fontFamily="var(--font-body)"
        >
          {unit}
        </text>
      </svg>
    </div>
  );
}
