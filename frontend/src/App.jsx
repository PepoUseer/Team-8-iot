import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { Header } from "@/components/Header";
import { SignInPage } from "@/components/SignInPage";
import { DevicesPage } from "@/components/DevicesPage";
import { DashboardPage } from "@/components/DashboardPage";

function AppRoutes() {
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const handleLogin = (email) => {
    setUser({ email });
    navigate("/devices");
  };

  const handleSelectDevice = (device) => {
    setSelectedDevice(device);
    navigate("/dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedDevice(null);
    navigate("/auth");
  };

  return (
    <div className="ab-page">
      <Header
        user={user}
        onLogoClick={() => user && navigate("/devices")}
        onLogout={handleLogout}
      />

      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/auth" replace />} />

        {/* Single auth route – tab is a query param: /auth?tab=login or /auth?tab=register */}
        <Route path="/auth" element={<SignInPage onLogin={handleLogin} />} />

        {/* Protected routes, redirect to /auth if no user) */}
        <Route
          path="/devices"
          element={
            user ? (
              <DevicesPage
                onSelectDevice={handleSelectDevice}
                onBack={() => navigate("/devices")}
              />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            user && selectedDevice ? (
              <DashboardPage
                device={selectedDevice}
                user={user}
                onBack={() => navigate("/devices")}
              />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
