import { useEffect, useState } from 'react';
import './App.css';

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

function App() {
  const [health, setHealth] = useState('Loading...');

  useEffect(() => {
    const controller = new AbortController();

    async function loadHealth() {
      try {
        const response = await fetch(`${apiUrl}/health`, {
          signal: controller.signal
        });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        setHealth(`API status: ${data.status}`);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setHealth('API is unreachable');
        }
      }
    }

    loadHealth();
    return () => controller.abort();
  }, []);

  return (
    <main className="app">
      <h1>Air Buddy</h1>
      <p>Kazdy clovek se lepe soustredi, kdyz muze dychat cisty vzduch.</p>
      <p>{health}</p>
    </main>
  );
}

export default App;
