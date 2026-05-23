import { useState, useEffect, useRef } from "react";
import { Settings, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { GaugeCard } from "@/components/GaugeCard";
import { GraphsPage } from "@/components/GraphsPage";
import { SettingsModal } from "@/components/SettingsModal";
import { api } from "@/api";
import { WorkInProgressPage } from "@/components/WorkInProgressPage";
import { useAlerts } from "@/hooks/useAlerts";

import {
  NotificationBell,
  useNotifications,
} from "@/components/NotificationBell";
const POLL_MS = 10000;
const GRAPHS_WIP = false;
const RANGE_MS = {
  hour: 60 * 60 * 1000,
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

const DEFAULT_LIMITS = {
  co2: { min: 350, max: 1000 },
  temperature: { min: 20, max: 26 },
  humidity: { min: 40, max: 60 },
  pressure: { min: 1013, max: 1020 },
};

export function DashboardPage({
  device,
  setSelectedDevice,
  user,
  onBack,
  onLogout,
}) {
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

  const [limits, setLimits] = useState(DEFAULT_LIMITS);
  const [sensorMap, setSensorMap] = useState({});
  const [limitsLoaded, setLimitsLoaded] = useState(false); // FIX: počkej na limity z DB

  //Notifikace
  const { notify, muteUntilRef, bellProps } = useNotifications();
  const { checkReadings } = useAlerts(notify, muteUntilRef, 60 * 60 * 1000); //1 upozornění za hodinu
  // Sensor id map: { co2: uuid, temperature: uuid, ... }
  const sensorIds = useRef({});

  // Ref pro aktuální limity — aby fetchLatest vždy viděl nejnovější hodnotu
  const limitsRef = useRef(limits);
  useEffect(() => {
    limitsRef.current = limits;
  }, [limits]);

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
          sensorIds.current[k] = s.sensor_id;
        }
      }
      setReading((prev) => ({ ...(prev ?? {}), ...r }));
      checkReadings(r, limitsRef.current, device.name); // FIX: použij ref, ne stale closure
      if (data.last_update) {
        const updatedAt = new Date(data.last_update);
        const ageMs = Date.now() - updatedAt.getTime();
        const isOld = ageMs > 24 * 60 * 60 * 1000;

        setLastUpdated(
          updatedAt.toLocaleString("cs-CZ", {
            ...(isOld && {
              weekday: "short",
              day: "numeric",
              month: "numeric",
            }),
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
      }
    } catch {
      // BUG 1 FIX: API selhalo — ponecháme předchozí data beze změny.
      // Pokud ještě žádná data nemáme, zůstane reading === null a UI zobrazí "—".
      // Mock data se NEZOBRAZUJÍ.
    }
  }

  // FIX: polling startuje až po načtení limitů z DB
  useEffect(() => {
    if (!limitsLoaded) return;
    setReading(null);
    sensorIds.current = {};
    fetchLatest();
    const id = setInterval(fetchLatest, POLL_MS);
    return () => clearInterval(id);
  }, [device, limitsLoaded]);

  useEffect(() => {
    if (GRAPHS_WIP) setGraphLoading(false);
  }, []);

  // Načtení senzorů při změně zařízení
  useEffect(() => {
    if (!device.id) return;
    setLimitsLoaded(false); // FIX: reset při změně zařízení

    const loadSensors = async () => {
      try {
        const sensors = await api.getDeviceSensors(device.id);
        if (!sensors || sensors.length === 0) {
          setLimitsLoaded(true); // i bez senzorů pustíme polling s DEFAULT_LIMITS
          return;
        }
        const newLimits = {};
        const newSensorMap = {};

        sensors.forEach((sensor) => {
          newLimits[sensor.sensor_type] = {
            min: sensor.threshold_min,
            max: sensor.threshold_max,
            unit: sensor.unit,
          };
          newSensorMap[sensor.sensor_type] = sensor.sensor_id;
        });

        setLimits(newLimits);
        setSensorMap(newSensorMap);
      } catch (err) {
        console.error(err);
      } finally {
        setLimitsLoaded(true); // FIX: vždy odblokuj polling, i při chybě
      }
    };

    loadSensors();
  }, [device.id]);

  // ── Graph history — reálné API, bez mock fallbacku ─────
  useEffect(() => {
    if (tab !== "graph") return;
    if (GRAPHS_WIP) return;
    async function fetchGraphData() {
      setGraphLoading(true);

      let ids = sensorIds.current;
      const hasIds = Object.keys(ids).length > 0;

      if (!hasIds) {
        await fetchLatest();
        ids = sensorIds.current;
        if (Object.keys(ids).length === 0) {
          setRangeHistory([]);
          setGraphLoading(false);
          return;
        }
      }

      const end = new Date().toISOString();
      const start = new Date(Date.now() - RANGE_MS[graphRange]).toISOString();

      try {
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

        const base = results.find((r) => r.data.length > 0);
        if (!base) {
          setRangeHistory([]);
          setGraphLoading(false);
          return;
        }

        const merged = base.data.map((point, i) => {
          const entry = { timestamp: new Date(point.time).getTime() };
          for (const { key, data } of results) {
            entry[key] = data[i] != null ? parseFloat(data[i].value) : null;
          }
          return entry;
        });
        console.log("merged history:", merged);
        setRangeHistory(merged);
      } catch {
        setRangeHistory([]);
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
    if (GRAPHS_WIP) return;
    const prev = prevSensorIdsRef.current;
    const curr = sensorIds.current;
    const wasEmpty = Object.keys(prev).length === 0;
    const nowHas = Object.keys(curr).length > 0;
    if (wasEmpty && nowHas) {
      prevSensorIdsRef.current = { ...curr };
      setGraphRange((r) => r);
    }
  }, [reading, tab]);

  const statusColor = (val, limits) => {
    if (val == null || !limits) return "rgba(255,255,255,0.2)";
    const { min, max } = limits;
    if (val < min || val > max) return "#ef4444";
    const margin = (max - min) * 0.2;
    if (val < min + margin || val > max - margin) return "#f97316";
    return "#22c55e";
  };

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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginLeft: "auto",
            }}
          >
            {/* Notification Bell */}
            <NotificationBell {...bellProps} />

            {/* Wrapper pro avatar a menu */}
            <div style={{ position: "relative" }}>
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
                      borderBottom: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--ab-text)",
                        marginBottom: "2px",
                      }}
                    >
                      {user.username}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "var(--ab-placeholder)",
                      }}
                    >
                      {user.email}
                    </div>
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
            max={limits.co2?.max ?? DEFAULT_LIMITS.co2.max}
            current={r.co2 ?? 0}
          />
          <GaugeCard
            label="Temperature"
            value={r.temperature != null ? r.temperature.toFixed(1) : "—"}
            unit="°C"
            color={statusColor(r.temperature, limits.temperature)}
            max={limits.temperature?.max ?? DEFAULT_LIMITS.temperature.max}
            current={r.temperature ?? 0}
          />
          <GaugeCard
            label="Humidity"
            value={r.humidity != null ? r.humidity.toFixed(0) : "—"}
            unit="%"
            color={statusColor(r.humidity, limits.humidity)}
            max={limits.humidity?.max ?? DEFAULT_LIMITS.humidity.max}
            current={r.humidity ?? 0}
          />
          <GaugeCard
            label="Barometric pressure"
            value={r.pressure != null ? r.pressure.toFixed(0) : "—"}
            unit="hPa"
            color={statusColor(r.pressure, limits.pressure)}
            max={limits.pressure?.max ?? DEFAULT_LIMITS.pressure.max}
            current={r.pressure ?? 950}
          />
        </div>
      )}
      {/* ── Graph tab ── */}

      {tab === "graph" &&
        (GRAPHS_WIP ? (
          <WorkInProgressPage />
        ) : (
          <div style={{ padding: "20px 24px 24px 0" }}>
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
              <GraphsPage
                history={rangeHistory}
                graphRange={graphRange}
                onRangeChange={setGraphRange}
                loading={graphLoading}
              />
            )}
          </div>
        ))}
      {settingsOpen && (
        <SettingsModal
          device={device}
          onDeviceUpdated={(updated) =>
            setSelectedDevice({
              ...device,
              name: updated.device_name,
            })
          }
          limits={limits}
          sensorMap={sensorMap}
          onSave={(newLimits) => setLimits(newLimits)}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
