import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { AddDeviceModal } from "@/components/AddDeviceModal";
import { api } from "@/api";

// Zařízení je "online" pokud poslalo data v posledních 5 minutách
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

function deriveStatus(lastUpdate) {
  if (!lastUpdate) return "offline";
  return Date.now() - new Date(lastUpdate).getTime() < ONLINE_THRESHOLD_MS
    ? "online"
    : "offline";
}

export function DevicesPage({ onSelectDevice }) {
  const [devices, setDevices] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDevices();
  }, []);

  async function fetchDevices() {
    setLoading(true);
    setError("");
    try {
      const data = await api.getDevices();
      // FIX: backend vrací device_name (ne name) a last_update pro status
      setDevices(
        (data.devices || []).map((d) => ({
          id: d.device_id,
          name: d.device_name,
          lastUpdate: d.last_update,
          status: deriveStatus(d.last_update),
        })),
      );
    } catch (err) {
      setError(err.message || "Failed to load devices.");
    } finally {
      setLoading(false);
    }
  }

  const handleAdd = async ({ deviceId }) => {
    await api.createDevice(deviceId);
    await fetchDevices();
    setShowAddModal(false);
  };

  return (
    <div style={{ padding: "32px 24px" }}>
      <h2
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "22px",
          fontWeight: 600,
          marginBottom: "20px",
          paddingLeft: "4px",
          color: "var(--ab-text)",
        }}
      >
        Your devices
      </h2>

      {loading && (
        <p
          style={{
            color: "var(--ab-placeholder)",
            fontFamily: "var(--font-body)",
            paddingLeft: 4,
          }}
        >
          Loading…
        </p>
      )}

      {error && (
        <p
          style={{
            color: "#ef4444",
            fontFamily: "var(--font-body)",
            paddingLeft: 4,
          }}
        >
          {error}
        </p>
      )}

      <div className="ab-devices-grid">
        {devices.map((device) => (
          <div
            key={device.id}
            className={`ab-device-card ${device.status}`}
            onClick={() => onSelectDevice(device)}
          >
            <span className="ab-device-name">{device.name}</span>
            <span className={`ab-device-status ${device.status}`}>
              {device.status}
            </span>
          </div>
        ))}

        {/* Add new device tile */}
        <div
          className="ab-add-device-card"
          onClick={() => setShowAddModal(true)}
          title="Add new device"
        >
          <Plus size={36} strokeWidth={1.5} />
        </div>
      </div>

      {showAddModal && (
        <AddDeviceModal
          onAdd={handleAdd}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
