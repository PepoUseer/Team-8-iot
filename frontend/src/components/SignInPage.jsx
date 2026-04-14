import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// Simple RFC-5322-lite email check
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignInPage({ onLogin }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") ?? "login"; // "login" | "register"

  const switchTab = (t) => setSearchParams({ tab: t });

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginEmailError, setLoginEmailError] = useState("");

  // Register state
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPassword2, setRegPassword2] = useState("");
  const [regEmailError, setRegEmailError] = useState("");
  const [regPasswordError, setRegPasswordError] = useState("");

  const loginReady =
    loginEmail.trim() !== "" && loginPassword.trim() !== "" && !loginEmailError;

  const regPasswordsMatch = regPassword2 === "" || regPassword === regPassword2;

  const registerReady =
    regEmail.trim() !== "" &&
    regPassword.trim() !== "" &&
    regPassword2.trim() !== "" &&
    !regEmailError &&
    regPassword === regPassword2;

  // ── Login handlers ──────────────────────────────────
  const handleLoginEmailBlur = () => {
    if (loginEmail && !EMAIL_RE.test(loginEmail)) {
      setLoginEmailError("Please enter a valid email address.");
    } else {
      setLoginEmailError("");
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(loginEmail)) {
      setLoginEmailError("Please enter a valid email address.");
      return;
    }
    if (!loginReady) return;
    onLogin(loginEmail);
  };

  // ── Register handlers ────────────────────────────────
  const handleRegEmailBlur = () => {
    if (regEmail && !EMAIL_RE.test(regEmail)) {
      setRegEmailError("Please enter a valid email address.");
    } else {
      setRegEmailError("");
    }
  };

  const handleRegPassword2Change = (val) => {
    setRegPassword2(val);
    if (val && regPassword && val !== regPassword) {
      setRegPasswordError("Passwords do not match.");
    } else {
      setRegPasswordError("");
    }
  };

  const handleRegPasswordChange = (val) => {
    setRegPassword(val);
    if (regPassword2 && val !== regPassword2) {
      setRegPasswordError("Passwords do not match.");
    } else {
      setRegPasswordError("");
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(regEmail)) {
      setRegEmailError("Please enter a valid email address.");
      return;
    }
    if (regPassword !== regPassword2) {
      setRegPasswordError("Passwords do not match.");
      return;
    }
    if (!registerReady) return;
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
                onChange={(e) => {
                  setLoginEmail(e.target.value);
                  if (loginEmailError) setLoginEmailError("");
                }}
                onBlur={handleLoginEmailBlur}
                autoComplete="email"
                style={
                  loginEmailError
                    ? { boxShadow: "0 0 0 2px rgba(239,68,68,0.5)" }
                    : {}
                }
              />
              {loginEmailError && (
                <span style={errorStyle}>{loginEmailError}</span>
              )}
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
                onChange={(e) => {
                  setRegEmail(e.target.value);
                  if (regEmailError) setRegEmailError("");
                }}
                onBlur={handleRegEmailBlur}
                autoComplete="email"
                style={
                  regEmailError
                    ? { boxShadow: "0 0 0 2px rgba(239,68,68,0.5)" }
                    : {}
                }
              />
              {regEmailError && <span style={errorStyle}>{regEmailError}</span>}
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
                onChange={(e) => handleRegPasswordChange(e.target.value)}
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
                onChange={(e) => handleRegPassword2Change(e.target.value)}
                autoComplete="new-password"
                style={
                  regPasswordError
                    ? { boxShadow: "0 0 0 2px rgba(239,68,68,0.5)" }
                    : {}
                }
              />
              {regPasswordError && (
                <span style={errorStyle}>{regPasswordError}</span>
              )}
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

const errorStyle = {
  fontFamily: "var(--font-body)",
  fontSize: "13px",
  fontWeight: 600,
  color: "#ef4444",
  marginTop: 2,
};
