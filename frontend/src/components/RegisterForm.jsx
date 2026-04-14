import { useState } from "react";

// Simple RFC-5322-lite email check (sdílené s LoginForm)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * RegisterForm
 * Props:
 *   onLogin(email) – zavolá se po úspěšné registraci (stejný callback jako login)
 */
export function RegisterForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const isReady =
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    if (password !== password2) {
      setPasswordError("Passwords do not match.");
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

      <div
        style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}
      >
        <button
          type="submit"
          className={`ab-btn${isReady ? " ready" : ""}`}
          style={{ minWidth: 134 }}
        >
          Register
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
