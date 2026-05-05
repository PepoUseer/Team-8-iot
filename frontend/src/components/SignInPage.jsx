import { useSearchParams } from "react-router-dom";
import { LoginForm } from "@/components/LoginForm";
import { RegisterForm } from "@/components/RegisterForm";

/**
 * SignInPage
 * Orchestruje přepínání mezi taby Login / Register.
 * Veškerá logika formulářů žije v LoginForm a RegisterForm.
 *
 * Route: /auth?tab=login  nebo  /auth?tab=register
 */
export function SignInPage({ onLogin }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") ?? "login"; // "login" | "register"

  const switchTab = (t) => setSearchParams({ tab: t });

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
          <LoginForm onLogin={onLogin} />
        ) : (
          <RegisterForm onLogin={onLogin} />
        )}
      </div>
    </div>
  );
}
