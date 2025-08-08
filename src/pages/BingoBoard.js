import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

function BingoBoard() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialBalance = parseFloat(localStorage.getItem("balance") || "200");
  const stake = location.state?.stake ?? 0;

  const [wallet, setWallet] = useState(initialBalance - stake);
  const [gameId, setGameId] = useState("");
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [bingoCard, setBingoCard] = useState([]);
  const [cartelaId, setCartelaId] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const id = "G" + Math.floor(1000 + Math.random() * 9000);
    setGameId(id);
  }, []);

  const generateCard = (selected) => {
    let numbers = Array.from({ length: 200 }, (_, i) => i + 1); // now 1-200
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
    setCartelaId(number);
    generateCard(number);
  };

  const handleStartGame = () => {
    if (!selectedNumber) {
      setShowModal(true);
      return;
    }

    const initialBalance = parseFloat(localStorage.getItem("balance") || "0");
    const newWallet = initialBalance - stake;

    if (newWallet < 0) {
      alert("Not enough balance!");
      return;
    }

    localStorage.setItem("balance", newWallet);
    setWallet(newWallet);

    navigate("/call", {
      state: {
        card: bingoCard,
        stake: stake,
        gameId: gameId,
        cartelaNumber: cartelaId,
      },
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1e3c72, #2a5298)", // blue gradient
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: "450px",
          background: "#fff",
          borderRadius: "15px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          padding: "20px",
          textAlign: "center",
          fontFamily: "Arial, sans-serif",
          width: "100%",
        }}
      >
        <img
          src={logo}
          alt="Logo"
          style={{
            width: "120px",
            marginBottom: "10px",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            background: "linear-gradient(90deg, orange, green, cyan)",
            borderRadius: "12px",
            color: "white",
            padding: "8px 10px",
            fontSize: "13px",
            flexWrap: "wrap",
            marginBottom: "15px",
          }}
        >
          <div>Wallet: Br{wallet}</div>
          <div>Game ID: {gameId}</div>
          <div>Stake: Br{stake}</div>
        </div>

        <h4 style={{ margin: "10px 0", color: "#333" }}>
          Select a Lucky Ticket Number
        </h4>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(8, 1fr)", // 8 columns
            gap: "6px",
            margin: "10px 0",
          }}
        >
          {Array.from({ length: 200 }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              style={{
                padding: "8px",
                background: selectedNumber === num ? "#00C9FF" : "#333",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
              }}
            >
              {num}
            </button>
          ))}
        </div>

        {bingoCard.length > 0 && (
          <>
            <h4 style={{ marginTop: "20px", color: "#4CAF50" }}>
              Your Bingo Card (Cartela: #{cartelaId})
            </h4>
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
                    color: "blue",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: "6px",
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

        <button
          onClick={handleStartGame}
          style={{
            marginTop: "20px",
            width: "100%",
            padding: "12px",
            background: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: "16px",
            transition: "background 0.3s",
          }}
        >
          🎮 Start Game
        </button>
      </div>

      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "10px",
              textAlign: "center",
              maxWidth: "300px",
            }}
          >
            <p
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                color: "#333",
                marginBottom: "20px",
              }}
            >
              ⚠️ Please select a ticket first!
            </p>
            <button
              onClick={() => setShowModal(false)}
              style={{
                padding: "8px 20px",
                background: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


export default BingoBoard;
