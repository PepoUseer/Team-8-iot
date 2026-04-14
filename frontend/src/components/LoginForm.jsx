import { useState } from "react";

// Simple RFC-5322-lite email check (sdílené s RegisterForm)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * LoginForm
 * Props:
 *   onLogin(email) – zavolá se po úspěšné validaci
 */
export function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");

  const isReady = email.trim() !== "" && password.trim() !== "" && !emailError;

  const handleEmailBlur = () => {
    if (email && !EMAIL_RE.test(email)) {
      setEmailError("Please enter a valid email address.");
    } else {
      setEmailError("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    if (!isReady) return;
    onLogin(email);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="ab-field">
        <label className="ab-label">
          E-mail <span>*</span>
        </label>
        <input
          className="ab-input"
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError("");
          }}
          onBlur={handleEmailBlur}
          autoComplete="email"
          style={
            emailError ? { boxShadow: "0 0 0 2px rgba(239,68,68,0.5)" } : {}
          }
        />
        {emailError && <span style={errorStyle}>{emailError}</span>}
      </div>

      <div className="ab-field">
        <label className="ab-label">
          Password <span>*</span>
        </label>
        <input
          className="ab-input"
          type="password"
          placeholder="••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </div>

      <div
        style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}
      >
        <button
          type="submit"
          className={`ab-btn${isReady ? " ready" : ""}`}
          style={{ minWidth: 112 }}
        >
          Login
        </button>
      </div>
    </form>
  );
}

const errorStyle = {
  fontFamily: "var(--font-body)",
  fontSize: "13px",
  fontWeight: 600,
  color: "#ef4444",
  marginTop: 2,
};
