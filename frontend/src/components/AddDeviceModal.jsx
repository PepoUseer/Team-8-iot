import { useState } from "react";

export function AddDeviceModal({ onAdd, onClose }) {
  const [name, setName] = useState("");
  const [deviceId, setDeviceId] = useState("");

  const canAdd = name.trim() !== "" && deviceId.trim() !== "";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canAdd) return;
    onAdd({ name: name.trim(), deviceId: deviceId.trim() });
  };

  return (
    <div
      className="ab-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="ab-modal">
        <button className="ab-modal-close" onClick={onClose}>
          ✕
        </button>

        <h2 className="ab-modal-title">Add new device</h2>

        <form onSubmit={handleSubmit}>
          <div className="ab-field">
            <label className="ab-label">Name of device</label>
            <input
              className="ab-input"
              type="text"
              placeholder="a name chosen by you"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="ab-field" style={{ marginBottom: 28 }}>
            <label className="ab-label">ID device</label>
            <input
              className="ab-input"
              type="text"
              placeholder="device hardware ID"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button type="button" className="ab-btn-cancel" onClick={onClose}>
              cancel
            </button>
            <button
              type="submit"
              className={`ab-btn${canAdd ? " ready" : ""}`}
              style={{ minWidth: 112 }}
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
