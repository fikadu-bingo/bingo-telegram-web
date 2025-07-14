import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import BingoBoard from "./pages/BingoBoard";
import Call from "./pages/Call";
import Preloader from "./Preloader"; // Adjust path if needed

function HomePage() {
  const navigate = useNavigate();
  const username = "Fikadu";
  const [balance, setBalance] = useState(200);
  const [selectedStake, setSelectedStake] = useState(null);

  const handleStakeClick = (amount) => {
    setSelectedStake(amount);
  };

  const handlePlayNow = () => {
    if (!selectedStake) {
      alert("Please select a stake first!");
      return;
    }
    if (balance < selectedStake) {
      alert("Not enough balance!");
      return;
    }
    navigate("/bingo", {
      state: { balance: balance, stake: selectedStake },
    });
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "20px auto",
        background: "#fff",
        borderRadius: "15px",
        boxShadow: "0 4px 15px rgba(245, 48, 48, 0.1)",
        padding: "20px",
        textAlign: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <img
        src="https://via.placeholder.com/100"
        alt="Profile"
        style={{
          borderRadius: "50%",
          width: "100px",
          height: "100px",
          objectFit: "cover",
          marginBottom: "10px",
          border: "3px solid #4CAF50",
        }}
      />
      <h3
        style={{
          margin: "0",
          fontSize: "20px",
          color: "#333",
          marginBottom: "15px",
        }}
      >
        {username}
      </h3>

      <div
        style={{
          background: "#F5F5F5",
          borderRadius: "12px",
          padding: "15px",
          margin: "20px 0",
          boxShadow: "0 2px 10px rgba(245, 39, 66, 0.05)",
        }}
      >
        <h3 style={{ margin: "0", fontSize: "18px", color: "#333" }}>
          Your Balance
        </h3>
        <p
          style={{
            fontSize: "26px",
            fontWeight: "bold",
            margin: "5px 0",
            color: "#4CAF50",
          }}
        >
          {balance} Br
        </p>
      </div>

      <h4 style={{ marginTop: "10px", color: "#444" }}>Select stake</h4>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "8px",
          margin: "15px 0",
        }}
      >
        {[200, 100, 50, 20, 10].map((amount) => (
          <button
            key={amount}
            style={{
              ...stakeBtnStyle,
              background: selectedStake === amount ? "#4CAF50" : "#f0f0f0",
              color: selectedStake === amount ? "white" : "black",
            }}
            onClick={() => handleStakeClick(amount)}
          >
            {amount} Br
          </button>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "10px",
          marginTop: "25px",
        }}
      >
        <button style={actionBtnStyle}>💰 Deposit</button>
        <button style={actionBtnStyle}>💵 Cash out</button>
        <button style={actionBtnStyle}>🔁 Transfer</button>
        <button style={actionBtnStyle} onClick={handlePlayNow}>
          🎮 Play now
        </button>
      </div>

      <p
        style={{
          fontSize: "13px",
          color: "#007BFF",
          textDecoration: "underline",
          cursor: "pointer",
          marginBottom: "0",
        }}
      >
        Have a promo code? Click here
      </p>
    </div>
  );
}

const stakeBtnStyle = {
  display: "inline-block",
  padding: "8px 16px",
  background: "#f0f0f0",
  border: "none",
  borderRadius: "8px",
  fontWeight: "bold",
  cursor: "pointer",
  fontSize: "13px",
};

const actionBtnStyle = {
  flex: "1 1 45%",
  padding: "12px",
  background: "#4CAF50",
  color: "white",
  border: "none",
  borderRadius: "10px",
  fontWeight: "bold",
  cursor: "pointer",
  fontSize: "14px",
};
function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time (3 seconds)
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