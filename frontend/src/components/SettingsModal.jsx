import { useState } from "react";

export function SettingsModal({ device, limits, onSave, onClose }) {
  const [name, setName] = useState(device.name);
  const [local, setLocal] = useState({ ...limits });

  const setMin = (key, val) =>
    setLocal((l) => ({ ...l, [key]: { ...l[key], min: Number(val) } }));
  const setMax = (key, val) =>
    setLocal((l) => ({ ...l, [key]: { ...l[key], max: Number(val) } }));

  const handleSave = (e) => {
    e.preventDefault();
    onSave(local);
  };

  return (
    <div
      className="ab-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="ab-modal" style={{ width: 620, maxWidth: "95vw" }}>
        <button className="ab-modal-close" onClick={onClose}>
          ✕
        </button>

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
              gap: "18px 32px",
              marginBottom: 28,
            }}
          >
            {[
              {
                key: "co2",
                label: "CO2 concentration",
                unitMin: "ppm",
                unitMax: "ppm",
              },
              {
                key: "humidity",
                label: "Humidity",
                unitMin: "%",
                unitMax: "%",
              },
              {
                key: "temperature",
                label: "Temperature",
                unitMin: "°C",
                unitMax: "°C",
              },
              {
                key: "pressure",
                label: "Barometric pressure",
                unitMin: "hPa",
                unitMax: "hPa",
              },
            ].map(({ key, label, unitMin, unitMax }) => (
              <div key={key}>
                <label
                  className="ab-label"
                  style={{ fontSize: 16, marginBottom: 8 }}
                >
                  {label}
                </label>
                <div className="ab-range-row">
                  <input
                    className="ab-range-input"
                    type="number"
                    value={local[key].min}
                    onChange={(e) => setMin(key, e.target.value)}
                  />
                  <span className="ab-range-sep">—</span>
                  <input
                    className="ab-range-input"
                    type="number"
                    value={local[key].max}
                    onChange={(e) => setMax(key, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button type="button" className="ab-btn-cancel" onClick={onClose}>
              cancel
            </button>
            <button type="submit" className="ab-btn" style={{ minWidth: 112 }}>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
