import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export function SignInPage({ onLogin }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") ?? "login"; // "login" | "register"

  const switchTab = (t) => setSearchParams({ tab: t });

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register state
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPassword2, setRegPassword2] = useState("");

  const loginReady = loginEmail.trim() !== "" && loginPassword.trim() !== "";
  const registerReady =
    regEmail.trim() !== "" &&
    regPassword.trim() !== "" &&
    regPassword2.trim() !== "";

  const handleLogin = (e) => {
    e.preventDefault();
    if (!loginReady) return;
    onLogin(loginEmail);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!registerReady) return;
    if (regPassword !== regPassword2) {
      alert("Passwords do not match");
      return;
    }
    onLogin(regEmail);
  };

  return (
    <div className="ab-auth-wrap">
      {/* Tab switcher */}
      <div className="ab-tabs" style={{ width: 400, maxWidth: "100%" }}>
        <button
          className={`ab-tab ${tab === "login" ? "active" : "inactive"}`}
          style={{ flex: 1 }}
          onClick={() => switchTab("login")}
        >
          Login
        </button>
        <button
          className={`ab-tab ${tab === "register" ? "active" : "inactive"}`}
          style={{ flex: 1 }}
          onClick={() => switchTab("register")}
        >
          Register
        </button>
      </div>

      {/* Card */}
      <div className="ab-auth-card">
        {tab === "login" ? (
          <form onSubmit={handleLogin}>
            <div className="ab-field">
              <label className="ab-label">
                E-mail <span>*</span>
              </label>
              <input
                className="ab-input"
                type="email"
                placeholder="email@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="ab-field">
              <label className="ab-label">
                Password <span>*</span>
              </label>
              <input
                className="ab-input"
                type="password"
                placeholder="••••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 8,
              }}
            >
              <button
                type="submit"
                className={`ab-btn${loginReady ? " ready" : ""}`}
                style={{ minWidth: 112 }}
              >
                Login
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="ab-field">
              <label className="ab-label">
                E-mail <span>*</span>
              </label>
              <input
                className="ab-input"
                type="email"
                placeholder="email@example.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="ab-field">
              <label className="ab-label">
                Password <span>*</span>
              </label>
              <input
                className="ab-input"
                type="password"
                placeholder="••••••••••"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div className="ab-field">
              <label className="ab-label">
                Password again <span>*</span>
              </label>
              <input
                className="ab-input"
                type="password"
                placeholder="••••••••••"
                value={regPassword2}
                onChange={(e) => setRegPassword2(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 8,
              }}
            >
              <button
                type="submit"
                className={`ab-btn${registerReady ? " ready" : ""}`}
                style={{ minWidth: 134 }}
              >
                Register
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
