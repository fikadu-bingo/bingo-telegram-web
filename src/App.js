import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import BingoBoard from "./pages/BingoBoard";
import Call from "./pages/Call";
import Preloader from "./Preloader";
import AgentLogin from "./pages/AgentLogin";
import AgentDashboard from "./pages/AgentDashBoard";
import TelegramAuth from "./auth/TelegramAuth"; // ✅ Corrected path

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Preloader />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* HomePage wrapped in TelegramAuth */}
        <Route
          path="/"
          element={
            <TelegramAuth>
              <HomePage />
            </TelegramAuth>
          }
        />
        <Route path="/bingo" element={<BingoBoard />} />
        <Route path="/call" element={<Call />} />
        <Route path="/agent-login" element={<AgentLogin />} />
        <Route path="/agent-dashboard" element={<AgentDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;