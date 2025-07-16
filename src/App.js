import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import BingoBoard from "./pages/BingoBoard";
import Call from "./pages/Call";
import Preloader from "./Preloader"; // Make sure path is correct

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading (3 seconds)
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;