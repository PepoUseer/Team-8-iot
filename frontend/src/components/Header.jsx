import { User } from "lucide-react";
import { useState } from "react";

export function Header({ user, onLogoClick, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="ab-header">
      <span
        className="ab-logo"
        style={{ cursor: "pointer" }}
        onClick={onLogoClick}
      >
        Air Buddy
      </span>

      {user && (
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
                  onLogout();
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
    </header>
  );
}
