import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useStore } from "./store";
import FrontView from "./views/FrontView";
import PlayerView from "./views/PlayerView";
import SettingsView from "./views/SettingsView";

function App() {
  const colourScheme = useStore((s) => s.colourScheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", colourScheme);
  }, [colourScheme]);

  return (
    <BrowserRouter basename="/pocket">
      <Routes>
        <Route path="/front" element={<FrontView />} />
        <Route path="/settings" element={<SettingsView />} />
        <Route path="/settings/:videoId" element={<SettingsView />} />
        <Route path="/:videoId" element={<PlayerView />} />
        <Route path="*" element={<Navigate to="/front" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
