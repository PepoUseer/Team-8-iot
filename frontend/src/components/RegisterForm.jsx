import { useState } from "react";
import { api } from "@/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * RegisterForm
 * Props:
 *   onLogin(user) – called after successful registration with user object
 */
export function RegisterForm({ onLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const isReady =
    username.trim() !== "" &&
    email.trim() !== "" &&
    password.trim() !== "" &&
    password2.trim() !== "" &&
    !emailError &&
    password === password2;

  const handleEmailBlur = () => {
    if (email && !EMAIL_RE.test(email)) {
      setEmailError("Please enter a valid email address.");
    } else {
      setEmailError("");
    }
  };

  const handlePasswordChange = (val) => {
    setPassword(val);
    if (password2 && val !== password2) {
      setPasswordError("Passwords do not match.");
    } else {
      setPasswordError("");
    }
  };

  const handlePassword2Change = (val) => {
    setPassword2(val);
    if (val && password && val !== password) {
      setPasswordError("Passwords do not match.");
    } else {
      setPasswordError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    if (password !== password2) {
      setPasswordError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    if (!isReady) return;

    setLoading(true);
    setServerError("");
    try {
      const data = await api.register(username, email, password);
      onLogin({
        email: data.user?.email ?? email,
        username: data.user?.username ?? username,
      });
    } catch (err) {
      setServerError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="ab-field">
        <label className="ab-label">
          Username <span>*</span>
        </label>
        <input
          className="ab-input"
          type="text"
          placeholder="your name"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            if (serverError) setServerError("");
          }}
          autoComplete="username"
        />
      </div>

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
          onChange={(e) => handlePasswordChange(e.target.value)}
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
          value={password2}
          onChange={(e) => handlePassword2Change(e.target.value)}
          autoComplete="new-password"
          style={
            passwordError ? { boxShadow: "0 0 0 2px rgba(239,68,68,0.5)" } : {}
          }
        />
        {passwordError && <span style={errorStyle}>{passwordError}</span>}
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
          style={{ minWidth: 134 }}
          disabled={loading}
        >
          {loading ? "…" : "Register"}
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
