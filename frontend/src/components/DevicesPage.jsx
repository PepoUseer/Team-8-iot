import { useState } from "react";
import { Plus } from "lucide-react";
import { AddDeviceModal } from "@/components/AddDeviceModal";

// Mock devices – replace with real API call when backend is ready
const MOCK_DEVICES = [
  { id: "dev-1", name: "Office Room", status: "online" },
  { id: "dev-2", name: "Server Room", status: "offline" },
];

export function DevicesPage({ onSelectDevice }) {
  const [devices, setDevices] = useState(MOCK_DEVICES);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAdd = ({ name, deviceId }) => {
    const newDevice = {
      id: deviceId || `dev-${Date.now()}`,
      name,
      status: "offline",
    };
    setDevices((prev) => [...prev, newDevice]);
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
