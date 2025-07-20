import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import BingoBoard from "./pages/BingoBoard";
import Call from "./pages/Call";
import Preloader from "./Preloader";
import AgentLogin from "./pages/AgentLogin"; // Make sure it's inside pages folder
import AgentDashboard from "./pages/AgentDashBoard";

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
        <Route path="/" element={<HomePage />} />
        <Route path="/bingo" element={<BingoBoard />} />
        <Route path="/call" element={<Call />} />
        <Route path="/agent-login" element={<AgentLogin />} />
        <Route path="/agent-dashboard" element={<AgentDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;