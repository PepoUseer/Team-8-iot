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
import { WorkInProgressPage } from "@/components/WorkInProgressPage";

function AppRoutes() {
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // onLogin now receives a user object { email, username } from the forms
  const handleLogin = (userObj) => {
    setUser(userObj);
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

  const dashboardProps = {
    device: selectedDevice,
    setSelectedDevice,
    user,
    onBack: () => navigate("/devices"),
    onLogout: handleLogout,
  };

  return (
    <div className="ab-page">
      <Header
        user={user}
        onLogoClick={() => user && navigate("/devices")}
        onLogout={handleLogout}
      />

      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />

        <Route path="/auth" element={<SignInPage onLogin={handleLogin} />} />

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
              <DashboardPage {...dashboardProps} />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        <Route
          path="/graphs"
          element={
            user && selectedDevice ? (
              <DashboardPage {...dashboardProps} />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

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
