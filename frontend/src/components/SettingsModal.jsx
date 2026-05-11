import { useState } from "react";
import { api } from "@/api";

// FIX: přidány props sensorMap (potřebné pro update senzorů)
export function SettingsModal({
  device,
  limits,
  sensorMap,
  onSave,
  onClose,
  onDeviceUpdated,
}) {
  const [name, setName] = useState(device.name);
  const [local, setLocal] = useState({ ...limits });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setMin = (key, val) =>
    setLocal((l) => ({ ...l, [key]: { ...l[key], min: Number(val) } }));
  const setMax = (key, val) =>
    setLocal((l) => ({ ...l, [key]: { ...l[key], max: Number(val) } }));

  // FIX: e.preventDefault() aby form nedělal native submit (= reload stránky)
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      // Ulož název zařízení
      const updated = await api.updateDevice(device.id, { deviceName: name });

      // Ulož limity senzorů
      if (sensorMap && Object.keys(sensorMap).length > 0) {
        await Promise.all(
          Object.entries(sensorMap).map(([type, sensorId]) => {
            const limit = local[type];
            if (!limit) return Promise.resolve();
            return api.updateSensor(sensorId, {
              thresholdMin: limit.min,
              thresholdMax: limit.max,
            });
          }),
        );
      }
      onDeviceUpdated(updated);
      onSave(local);
      onClose();
    } catch (err) {
      setError(err.message || "Uložení se nezdařilo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="ab-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="ab-modal"
        style={{
          width: 480,
          maxWidth: "calc(100vw - 40px)",
          boxSizing: "border-box",
        }}
      >
        <button className="ab-modal-close" onClick={onClose}>
          ✕
        </button>

        {/* FIX: onSubmit na form — handleSave má e.preventDefault() */}
        <form onSubmit={handleSave}>
          {/* Change device name */}
          <h2 className="ab-modal-title">Change device name</h2>
          <div className="ab-field" style={{ marginBottom: 24 }}>
            <input
              className="ab-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name of device"
              style={{ maxWidth: 322 }}
            />
          </div>

          {/* Change limits */}
          <h3 className="ab-modal-subtitle">Change limits for notifications</h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "18px 16px",
              marginBottom: 28,
              minWidth: 0,
            }}
          >
            {[
              { key: "co2", label: "CO2 concentration", unit: "ppm" },
              { key: "humidity", label: "Humidity", unit: "%" },
              { key: "temperature", label: "Temperature", unit: "°C" },
              { key: "pressure", label: "Barometric pressure", unit: "hPa" },
            ].map(({ key, label, unit }) => (
              <div key={key}>
                <label
                  className="ab-label"
                  style={{ fontSize: 16, marginBottom: 8 }}
                >
                  {label}
                </label>
                <div className="ab-range-row">
                  {/* Min input */}
                  <div className="ab-range-input-unit">
                    <input
                      className="ab-range-input"
                      type="number"
                      value={local[key]?.min ?? ""}
                      onChange={(e) => setMin(key, e.target.value)}
                    />
                    <span className="ab-range-unit-inside">{unit}</span>
                  </div>

                  <span className="ab-range-sep">—</span>

                  {/* Max input */}
                  <div className="ab-range-input-unit">
                    <input
                      className="ab-range-input"
                      type="number"
                      value={local[key]?.max ?? ""}
                      onChange={(e) => setMax(key, e.target.value)}
                    />
                    <span className="ab-range-unit-inside">{unit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <p
              style={{
                color: "#ef4444",
                fontSize: "13px",
                marginBottom: 12,
                fontFamily: "var(--font-body)",
              }}
            >
              {error}
            </p>
          )}

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button type="button" className="ab-btn-cancel" onClick={onClose}>
              cancel
            </button>
            <button
              type="submit"
              className="ab-btn ready"
              style={{ minWidth: 112 }}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
