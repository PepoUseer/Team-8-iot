import { useState, useEffect, useRef } from "react";
import { Settings, User } from "lucide-react";
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

const POLL_MS = 5000;

const RANGE_MS = {
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
};

export function DashboardPage({ device, user, onBack, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isGraphs = location.pathname === "/graphs";
  const tab = isGraphs ? "graph" : "current";

  const [graphRange, setGraphRange] = useState("week");
  const [rangeHistory, setRangeHistory] = useState([]);
  const [reading, setReading] = useState(generateMockReading(null));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [limits, setLimits] = useState({
    co2: { min: 350, max: 1000 },
    temperature: { min: 20, max: 26 },
    humidity: { min: 40, max: 60 },
    pressure: { min: 1013, max: 1020 },
  });

  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setReading((prev) => generateMockReading(prev));
    }, POLL_MS);
    return () => clearInterval(intervalRef.current);
  }, [device]);

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

  const statusColor = (val, { min, max }) => {
    if (val < min || val > max) return "#ef4444";
    const margin = (max - min) * 0.1;
    if (val < min + margin || val > max - margin) return "#f97316";
    return "#22c55e";
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* ── Jediný řádek: Logo + taby + avatar ── */}
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

        {/* Avatar přesunut sem — marginLeft: auto ho tlačí doprava */}
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
            display: "flex",
            flexWrap: "wrap",
            gap: 28,
            padding: "20px 24px 24px",
            justifyContent: "center",
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
