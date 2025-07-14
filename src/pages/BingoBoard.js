import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png"; // adjust path if needed
function BingoBoard() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialBalance = location.state?.balance || 200;
  const stake = location.state?.stake || 0;

  const [wallet, setWallet] = useState(initialBalance - stake);
  const [gameId, setGameId] = useState("");
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [bingoCard, setBingoCard] = useState([]);
  const [cartelaId, setCartelaId] = useState("");

  useEffect(() => {
    // Generate unique game ID
    const id = "G" + Math.floor(1000 + Math.random() * 9000);
    setGameId(id);

    // Generate unique cartela number
    const cartelaNum = "#" + Math.floor(1000 + Math.random() * 9000);
    setCartelaId(cartelaNum);
  }, []);

  const generateCard = (selected) => {
    let numbers = Array.from({ length: 100 }, (_, i) => i + 1);
    numbers = numbers.filter((num) => num !== selected);

    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    const cardNumbers = numbers.slice(0, 24);
    cardNumbers.splice(12, 0, selected);

    const card = [];
    for (let i = 0; i < 5; i++) {
      card.push(cardNumbers.slice(i * 5, i * 5 + 5));
    }

    setBingoCard(card);
  };

  const handleNumberClick = (number) => {
    setSelectedNumber(number);
    generateCard(number);
  };

const handleStartGame = () => {
  if (!selectedNumber) {
    alert("Please select a ticket first!");
    return;
  }

  const cartelaNumber = Math.floor(1000 + Math.random() * 9000);

  navigate("/call", {
    state: {
      card: bingoCard,
      stake: stake,
      wallet: wallet,
      gameId: gameId,
      cartelaNumber: cartelaId,
    },
  });
};

  return (
    <div style={{ padding: "10px", textAlign: "center" }}>
      <img
  src={logo}
  alt="Logo"
  style={{
    width: "120px", 
    height: "auto",
    marginBottom: "10px"
  }}
/>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "10px",
          background: "linear-gradient(90deg, orange, green, cyan)",
          borderRadius: "10px",
          color: "white",
          padding: "5px 10px",
          fontSize: "14px",
          flexWrap: "wrap",
        }}
      >
        <div>Wallet: Br{wallet}</div>
        <div>Game ID: {gameId}</div>
        <div>Stake: Br{stake}</div>
      </div>

      {/* Number selection grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "5px",
          margin: "10px 0",
        }}
      >
        {Array.from({ length: 100 }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            onClick={() => handleNumberClick(num)}
            style={{
              padding: "6px",
              background: selectedNumber === num ? "#00C9FF" : "#222",
              color: "#fff",
              border: "1px solid #555",
              borderRadius: "4px",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            {num}
          </button>
        ))}
      </div>

      {/* Show text only if ticket not selected */}
      {!selectedNumber && (
        <p style={{ marginTop: "15px", fontSize: "14px", fontWeight: "bold" }}>
          Select a ticket to play
        </p>
      )}

      {bingoCard.length > 0 && (
        <>
          <h4>Your Bingo Card (Cartela: {cartelaId})</h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 40px)",
              justifyContent: "center",
              gap: "5px",
              margin: "10px auto",
            }}
          >
            {bingoCard.flat().map((num, idx) => (
              <div
                key={idx}
                style={{
                  width: "40px",
                  height: "40px",
                  background: num === selectedNumber ? "#FF5722" : "#333",
                  color: "#fff",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: "5px",
                  fontSize: "13px",
                  fontWeight: "bold",
                }}
              >
                {num === selectedNumber ? "*" : num}
              </div>
            ))}
          </div>
        </>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "15px",
          marginTop: "20px",
        }}
      >
        <button
          onClick={handleStartGame}
          style={actionBtnStyle}
        >
          🎮 Start Game
        </button>
      </div>
    </div>
  );
}

const actionBtnStyle = {
  padding: "10px 20px",
  background: "#4CAF50",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

export default BingoBoard;