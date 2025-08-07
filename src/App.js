import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AdminDashboard from "./pages/AdminDashboard";
import HomePage from "./pages/HomePage";
import BingoBoard from "./pages/BingoBoard";
import Call from "./pages/Call";
import Preloader from "./Preloader";
import AgentLogin from "./pages/AgentLogin";
import AgentDashboard from "./pages/AgentDashBoard";
import TelegramAuth from "./auth/TelegramAuth";
import PromoterDashboard from "./pages/PromoterDashboard";
import PromoterLogin from "./pages/PromoterLogin";

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
        {/* User routes */}
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

        {/* Admin */}
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Agent */}
        <Route path="/agent-login" element={<AgentLogin />} />
        <Route
          path="/agent-dashboard"
          element={
            localStorage.getItem("agentToken") ? (
              <AgentDashboard />
            ) : (
              <Navigate to="/agent-login" replace />
            )
          }
        />

        {/* Promoter */}
        <Route path="/promoter" element={<PromoterLogin />} />
        <Route
          path="/promoter-dashboard"
          element={
            localStorage.getItem("promoterToken") ? (
              <PromoterDashboard />
            ) : (
              <Navigate to="/promoter" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;