import { useState, useRef, useEffect, useCallback } from "react";

/**
 * NotificationBell
 *
 * Kompletní notifikační systém pro Air Buddy:
 * - Zvonek v nav baru s badge nepřečtených alertů
 * - Dropdown panel s historií upozornění
 * - Mute modal (ztlumení na 15/30/60 min nebo vlastní hodnotu)
 * - Zvukový alert (Web Audio API — žádná závislost navíc)
 * - useAlertSound hook pro přehrání pípnutí
 *
 * Použití v DashboardPage.jsx:
 *
 *   import { NotificationBell, useNotifications } from "@/components/NotificationBell";
 *
 *   // 1. Uvnitř DashboardPage:
 *   const { notify, muteUntilRef, AlertToastContainer, bellProps } = useNotifications();
 *
 *   // 2. V nav baru (vedle ab-user-avatar):
 *   <NotificationBell {...bellProps} />
 *
 *   // 3. V JSX returnu (před poslední </div>):
 *   <AlertToastContainer />
 *
 *   // 4. useAlerts volej s muteUntilRef:
 *   const { checkReadings } = useAlerts(notify, muteUntilRef, 60 * 1000);
 */

// ─── Zvuk ────────────────────────────────────────────────────────────────────

function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Dvě krátká pípnutí
    [0, 0.22].forEach((startOffset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime + startOffset);
      osc.frequency.exponentialRampToValueAtTime(
        660,
        ctx.currentTime + startOffset + 0.15,
      );

      gain.gain.setValueAtTime(0, ctx.currentTime + startOffset);
      gain.gain.linearRampToValueAtTime(
        0.35,
        ctx.currentTime + startOffset + 0.02,
      );
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + startOffset + 0.18,
      );

      osc.start(ctx.currentTime + startOffset);
      osc.stop(ctx.currentTime + startOffset + 0.2);
    });
  } catch {
    // AudioContext nedostupný — tiché selhání
  }
}

// ─── Ikony ───────────────────────────────────────────────────────────────────

function BellIcon({ muted }) {
  return muted ? (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      <path d="M18.63 13A17.89 17.89 0 0 1 18 8" />
      <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" />
      <path d="M18 8a6 6 0 0 0-9.33-5" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function WarningTriangle() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      style={{ flexShrink: 0, marginTop: 1 }}
    >
      <path
        d="M12 3L2 21h20L12 3z"
        stroke="#f97316"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="rgba(249,115,22,0.18)"
      />
      <line
        x1="12"
        y1="10"
        x2="12"
        y2="15"
        stroke="#f97316"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="18" r="1" fill="#f97316" />
    </svg>
  );
}

// ─── Mute Modal ───────────────────────────────────────────────────────────────

const MUTE_PRESETS = [
  { label: "15 min", ms: 15 * 60 * 1000 },
  { label: "30 min", ms: 30 * 60 * 1000 },
  { label: "1 hour", ms: 60 * 60 * 1000 },
  { label: "∞", ms: Number.MAX_SAFE_INTEGER },
];

function MuteModal({ onConfirm, onCancel }) {
  const [selected, setSelected] = useState(0);
  const [customMin, setCustomMin] = useState("60");

  function handleConfirm() {
    const preset = MUTE_PRESETS[selected];
    const ms = preset.ms;
    if (!ms || ms <= 0) return;
    onConfirm(ms);
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onCancel}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          zIndex: 300,
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 301,
          background: "#434446",
          borderRadius: 14,
          padding: "32px 36px",
          width: 360,
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        {/* Close */}
        <button
          onClick={onCancel}
          style={{
            position: "absolute",
            top: 16,
            right: 18,
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.4)",
            fontSize: 20,
            cursor: "pointer",
            lineHeight: 1,
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "rgba(255,255,255,0.4)")
          }
        >
          ✕
        </button>

        <h2 className="ab-modal-title" style={{ marginBottom: 8 }}>
          Mute notifications
        </h2>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 14,
            color: "var(--ab-text-dim)",
            marginBottom: 24,
            lineHeight: 1.5,
          }}
        >
          Alerts will be paused. Threshold breaches will still appear in the
          notification history.
        </p>

        {/* Preset buttons */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          {MUTE_PRESETS.map((p, i) => (
            <button
              key={p.label}
              onClick={() => setSelected(i)}
              style={{
                padding: "8px 16px",
                borderRadius: "var(--ab-radius-btn)",
                border:
                  selected === i
                    ? "1.5px solid var(--ab-accent)"
                    : "1.5px solid rgba(255,255,255,0.15)",
                background:
                  selected === i ? "rgba(158,112,85,0.2)" : "transparent",
                color: selected === i ? "var(--ab-text)" : "var(--ab-text-dim)",
                fontFamily: "var(--font-body)",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 28,
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: "10px 20px",
              borderRadius: "var(--ab-radius-btn)",
              border: "none",
              background: "var(--ab-cancel)",
              color: "var(--ab-text)",
              fontFamily: "var(--font-body)",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: "10px 24px",
              borderRadius: "var(--ab-radius-btn)",
              border: "none",
              background: "var(--ab-accent)",
              color: "var(--ab-text)",
              fontFamily: "var(--font-body)",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--ab-accent-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "var(--ab-accent)")
            }
          >
            Mute
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Alert Toast (single) ─────────────────────────────────────────────────────

const AUTO_DISMISS_MS = 8000;

function SingleToast({ alert, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true));
    timerRef.current = setTimeout(handleDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timerRef.current);
  }, []);

  function handleDismiss() {
    setVisible(false);
    setTimeout(onDismiss, 300);
  }

  const { label, value, unit, min, max, deviceName, isRepeat } = alert;
  const direction =
    value > max ? `above max (${max} ${unit})` : `below min (${min} ${unit})`;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        background: "#434446",
        border: "1.5px solid rgba(249,115,22,0.45)",
        borderRadius: 12,
        padding: "14px 16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
        minWidth: 300,
        maxWidth: 360,
        position: "relative",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
        pointerEvents: "auto",
      }}
    >
      <WarningTriangle />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 11,
            fontWeight: 700,
            color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            marginBottom: 2,
          }}
        >
          {deviceName}
          {isRepeat ? " · repeat alert" : ""}
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 15,
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1.3,
            marginBottom: 3,
          }}
        >
          {label} out of range
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            fontWeight: 600,
            color: "rgba(255,255,255,0.6)",
          }}
        >
          <span style={{ color: "#f97316", fontWeight: 700 }}>
            {typeof value === "number"
              ? value.toFixed(value % 1 === 0 ? 0 : 1)
              : value}{" "}
            {unit}
          </span>{" "}
          · {direction}
        </div>
      </div>

      <button
        onClick={handleDismiss}
        style={{
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.35)",
          fontSize: 17,
          cursor: "pointer",
          lineHeight: 1,
          padding: "0 0 0 4px",
          flexShrink: 0,
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = "rgba(255,255,255,0.35)")
        }
        aria-label="Dismiss"
      >
        ✕
      </button>

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: 3,
          borderRadius: "0 0 12px 12px",
          background: "#f97316",
          animation: `ab-toast-progress ${AUTO_DISMISS_MS}ms linear forwards`,
        }}
      />
    </div>
  );
}

// ─── Toast Container ──────────────────────────────────────────────────────────

let toastIdCounter = 0;

function AlertToastContainer({ toasts, onDismiss }) {
  return (
    <>
      <style>{`
        @keyframes ab-toast-progress {
          from { width: 100%; }
          to   { width: 0%;   }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 200,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          alignItems: "flex-end",
          pointerEvents: "none",
        }}
      >
        {toasts.map(({ id, alert }) => (
          <SingleToast key={id} alert={alert} onDismiss={() => onDismiss(id)} />
        ))}
      </div>
    </>
  );
}

// ─── Notification Dropdown ────────────────────────────────────────────────────

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString("cs-CZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function NotificationDropdown({
  alerts,
  muteUntil,
  onMute,
  onUnmute,
  onClear,
  onClose,
}) {
  const isMuted = muteUntil && Date.now() < muteUntil;
  const muteRemaining = isMuted
    ? Math.ceil((muteUntil - Date.now()) / 60000)
    : 0;

  return (
    <div
      style={{
        position: "absolute",
        right: 0,
        top: "52px",
        background: "#434446",
        borderRadius: 12,
        width: 340,
        boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
        zIndex: 100,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 16px 12px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 18,
            fontWeight: 700,
            color: "var(--ab-text)",
          }}
        >
          Notifications
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {alerts.length > 0 && (
            <button
              onClick={onClear}
              style={{
                background: "none",
                border: "none",
                fontFamily: "var(--font-body)",
                fontSize: 12,
                fontWeight: 700,
                color: "var(--ab-text-dim)",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: 6,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--ab-text-dim)")
              }
            >
              Clear all
            </button>
          )}
          {isMuted ? (
            <button
              onClick={onUnmute}
              style={{
                padding: "5px 12px",
                borderRadius: 8,
                border: "1.5px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.06)",
                color: "var(--ab-text-dim)",
                fontFamily: "var(--font-body)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                e.currentTarget.style.color = "var(--ab-text-dim)";
              }}
              title="Click to unmute"
            >
              <BellIcon muted />
              <span>
                {muteRemaining > 525600 ? "∞" : `${muteRemaining} min`}
              </span>
            </button>
          ) : (
            <button
              onClick={onMute}
              style={{
                padding: "5px 12px",
                borderRadius: 8,
                border: "1.5px solid rgba(255,255,255,0.15)",
                background: "transparent",
                color: "var(--ab-text-dim)",
                fontFamily: "var(--font-body)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--ab-text-dim)";
              }}
            >
              <BellIcon muted={false} />
              <span>Mute</span>
            </button>
          )}
        </div>
      </div>

      {/* Alert list */}
      <div style={{ maxHeight: 360, overflowY: "auto" }}>
        {alerts.length === 0 ? (
          <div
            style={{
              padding: "32px 16px",
              textAlign: "center",
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--ab-text-dim)",
            }}
          >
            No alerts yet
          </div>
        ) : (
          [...alerts].reverse().map((a) => (
            <div
              key={a.id}
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
              }}
            >
              <WarningTriangle />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#fff",
                    marginBottom: 2,
                  }}
                >
                  {a.label} — {a.deviceName}
                  {a.isRepeat && (
                    <span
                      style={{
                        marginLeft: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--ab-text-dim)",
                        verticalAlign: "middle",
                      }}
                    >
                      repeat
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--ab-text-dim)",
                  }}
                >
                  <span style={{ color: "#f97316", fontWeight: 700 }}>
                    {typeof a.value === "number"
                      ? a.value.toFixed(a.value % 1 === 0 ? 0 : 1)
                      : a.value}{" "}
                    {a.unit}
                  </span>{" "}
                  · {a.value > a.max ? `max ${a.max}` : `min ${a.min}`} {a.unit}
                </div>
              </div>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.3)",
                  flexShrink: 0,
                  paddingTop: 2,
                }}
              >
                {formatTime(a.timestamp)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Bell Component ──────────────────────────────────────────────────────

export function NotificationBell({
  alerts,
  toasts,
  onToastDismiss,
  muteUntil,
  onMute,
  onUnmute,
  onClear,
}) {
  const [open, setOpen] = useState(false);
  const [muteModalOpen, setMuteModalOpen] = useState(false);
  const ref = useRef(null);

  const unreadCount = alerts.filter((a) => !a.read).length;
  const isMuted = muteUntil && Date.now() < muteUntil;

  // Zavři dropdown kliknutím mimo
  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleBellClick() {
    setOpen((o) => !o);
  }

  function handleMuteConfirm(ms) {
    onMute(ms);
    setMuteModalOpen(false);
  }

  return (
    <>
      {/* Bell button */}
      <div ref={ref} style={{ position: "relative" }}>
        <button
          onClick={handleBellClick}
          className="ab-user-avatar"
          title={isMuted ? "Notifications muted" : "Notifications"}
          style={{ position: "relative" }}
        >
          <span
            style={{ color: isMuted ? "var(--ab-text-dim)" : "currentColor" }}
          >
            <BellIcon muted={isMuted} />
          </span>

          {/* Badge */}
          {unreadCount > 0 && !isMuted && (
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                background: "#ef4444",
                color: "#fff",
                borderRadius: "50%",
                width: 18,
                height: 18,
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "var(--font-body)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid var(--ab-header)",
                lineHeight: 1,
              }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {open && (
          <NotificationDropdown
            alerts={alerts}
            muteUntil={muteUntil}
            onMute={() => {
              setOpen(false);
              setMuteModalOpen(true);
            }}
            onUnmute={() => {
              onUnmute();
            }}
            onClear={() => {
              onClear();
            }}
            onClose={() => setOpen(false)}
          />
        )}
      </div>

      {/* Toast stack */}
      <AlertToastContainer toasts={toasts} onDismiss={onToastDismiss} />

      {/* Mute modal */}
      {muteModalOpen && (
        <MuteModal
          onConfirm={handleMuteConfirm}
          onCancel={() => setMuteModalOpen(false)}
        />
      )}
    </>
  );
}

// ─── useNotifications hook ────────────────────────────────────────────────────

/**
 * useNotifications
 *
 * Hlavní hook — spravuje historii alertů, toasty, mute stav.
 * Vrátí vše co potřebuje DashboardPage.
 */
export function useNotifications() {
  const [alerts, setAlerts] = useState([]); // historie (dropdown)
  const [toasts, setToasts] = useState([]); // aktuální toasty
  const [muteUntil, setMuteUntil] = useState(null);
  const muteUntilRef = useRef(null); // ref pro useAlerts (bez re-renderu)

  const notify = useCallback((alert) => {
    const toastId = ++toastIdCounter;

    // Přidej do historie
    setAlerts((prev) => [...prev, { ...alert, read: false }]);

    // Přidej toast
    setToasts((prev) => [...prev, { id: toastId, alert }]);

    // Přehraj zvuk
    playAlertSound();
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const mute = useCallback((ms) => {
    const until = Date.now() + ms;
    setMuteUntil(until);
    muteUntilRef.current = until;
  }, []);

  const unmute = useCallback(() => {
    setMuteUntil(null);
    muteUntilRef.current = null;
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Označ vše jako přečtené při otevření (neřešíme zde — badge se resetuje na 0 po clear)

  const bellProps = {
    alerts,
    toasts,
    onToastDismiss: dismissToast,
    muteUntil,
    onMute: mute,
    onUnmute: unmute,
    onClear: clearAlerts,
  };

  return { notify, muteUntilRef, bellProps };
}
