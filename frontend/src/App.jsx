import { useEffect, useState } from "react";
import "./App.css";
// Imports for your new components
import { LoginForm } from "@/components/login-form";
import { DevicePicker } from "@/components/device-picker";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

function App() {
  const [health, setHealth] = useState("Loading...");
  // 1. Add state to control which screen is visible
  const [view, setView] = useState("login"); // Options: 'login', 'picker', 'dashboard'
  const [selectedDevice, setSelectedDevice] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadHealth() {
      try {
        const response = await fetch(`${apiUrl}/health`, {
          signal: controller.signal,
        });
        const data = await response.json();
        setHealth(`API status: ${data.status}`);
      } catch (error) {
        if (error.name !== "AbortError") setHealth("API is unreachable");
      }
    }
    loadHealth();
    return () => controller.abort();
  }, []);

  // 2. Logic for when a device is clicked in the picker
  const handleDeviceSelect = (device) => {
    setSelectedDevice(device);
    setView("dashboard");
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-zinc-50 p-6 md:p-10">
      <div className="w-full max-w-4xl">
        {/* --- LOGIN VIEW --- */}
        {view === "login" && (
          <div className="mx-auto max-w-sm">
            <h1 className="mb-6 text-center text-3xl font-bold tracking-tight">
              Air Buddy
            </h1>
            {/* Wrap LoginForm in a div to simulate a login click for now */}
            <div onClick={() => setView("picker")}>
              <LoginForm />
            </div>
          </div>
        )}

        {/* --- DEVICE PICKER VIEW --- */}
        {view === "picker" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Vaše zařízení</h2>
              <button
                onClick={() => setView("login")}
                className="text-xs text-muted-foreground hover:underline"
              >
                Odhlásit se
              </button>
            </div>

            {/* The component we just built */}
            <DevicePicker onSelect={handleDeviceSelect} />
          </div>
        )}

        {/* --- DASHBOARD VIEW (When a device is selected) --- */}
        {view === "dashboard" && (
          <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
            <h2 className="text-2xl font-bold tracking-tight">
              Senzor: {selectedDevice?.name}
            </h2>
            <p className="text-muted-foreground mt-2">
              Zde brzy uvidíte grafy kvality vzduchu...
            </p>
            <button
              onClick={() => setView("picker")}
              className="mt-6 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Zpět na seznam
            </button>
          </div>
        )}

        {/* --- GLOBAL FOOTER --- */}
        <footer className="mt-12 text-center text-xs text-muted-foreground">
          <p>{health}</p>
        </footer>
      </div>
    </main>
  );
}

export default App;
