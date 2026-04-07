import { useState } from "react";
import { Header } from "@/components/Header";
import { SignInPage } from "@/components/SignInPage";
import { DevicesPage } from "@/components/DevicesPage";
import { DashboardPage } from "@/components/DashboardPage";

function App() {
  const [view, setView] = useState("signin"); // "signin" | "devices" | "dashboard"
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [user, setUser] = useState(null); // { email }

  const handleLogin = (email) => {
    setUser({ email });
    setView("devices");
  };

  const handleSelectDevice = (device) => {
    setSelectedDevice(device);
    setView("dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedDevice(null);
    setView("signin");
  };

  return (
    <div className="ab-page">
      <Header
        user={user}
        onLogoClick={() => view !== "signin" && setView("devices")}
        onLogout={handleLogout}
      />

      {view === "signin" && <SignInPage onLogin={handleLogin} />}

      {view === "devices" && (
        <DevicesPage
          onSelectDevice={handleSelectDevice}
          onBack={() => setView("devices")}
        />
      )}

      {view === "dashboard" && selectedDevice && (
        <DashboardPage
          device={selectedDevice}
          onBack={() => setView("devices")}
        />
      )}
    </div>
  );
}

export default App;
