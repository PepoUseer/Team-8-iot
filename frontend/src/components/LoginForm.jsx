import { useState } from "react";
import { api } from "@/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * LoginForm
 * Props:
 *   onLogin(user) – called after successful login with user object { email, username }
 */
export function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const isReady = email.trim() !== "" && password.trim() !== "" && !emailError;

  const handleEmailBlur = () => {
    if (email && !EMAIL_RE.test(email)) {
      setEmailError("Please enter a valid email address.");
    } else {
      setEmailError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    if (!isReady) return;

    setLoading(true);
    setServerError("");
    try {
      const data = await api.login(email, password);
      onLogin({
        email: data.user?.email ?? email,
        username: data.user?.username,
      });
    } catch (err) {
      setServerError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
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
            if (serverError) setServerError("");
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
          onChange={(e) => {
            setPassword(e.target.value);
            if (serverError) setServerError("");
          }}
          autoComplete="current-password"
        />
      </div>

      {serverError && (
        <p style={{ ...errorStyle, marginBottom: 8 }}>{serverError}</p>
      )}

      <div
        style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}
      >
        <button
          type="submit"
          className={`ab-btn${isReady && !loading ? " ready" : ""}`}
          style={{ minWidth: 112 }}
          disabled={loading}
        >
          {loading ? "…" : "Login"}
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
