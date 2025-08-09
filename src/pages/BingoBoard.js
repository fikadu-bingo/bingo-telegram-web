import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import io from "socket.io-client";
import "../components/CartelaModal.css";

const SOCKET_SERVER_URL = "https://bingo-server-rw7p.onrender.com";

function BingoBoard() {
  const location = useLocation();
  const navigate = useNavigate();

  const stake = location.state?.stake ?? 0;

  // Initialize wallet from localStorage, deduct stake immediately for UI
  const initialBalance = parseFloat(localStorage.getItem("balance") ?? "200");
  const [wallet, setWallet] = useState(initialBalance - stake);

  // Use "Br" prefix to align with HomePage gameId format
  const [gameId, setGameId] = useState("");

  const [selectedNumber, setSelectedNumber] = useState(null);
  const [bingoCard, setBingoCard] = useState([]);
  const [cartelaId, setCartelaId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showCartelaModal, setShowCartelaModal] = useState(false);

  // Store all players' ticket selections: { userId: [numbers...] }
  const [allTicketSelections, setAllTicketSelections] = useState({});

  // Track if game has started to prevent changes
  const [gameStarted, setGameStarted] = useState(false);

  const socketRef = useRef();

  useEffect(() => {
    // Consistent gameId format "Br" + stake
    const id = "Br" + stake;
    setGameId(id);

    socketRef.current = io(SOCKET_SERVER_URL, {
      transports: ["websocket"],
    });

    const telegramUser = JSON.parse(localStorage.getItem("telegramUser"));
    const userId = telegramUser?.id || "anonymous";

    // Join the game room on socket
    socketRef.current.emit("joinGame", { gameId: id, userId });

    // Listen for live ticket updates from server
    socketRef.current.on("ticketNumbersUpdated", (tickets) => {
      setAllTicketSelections(tickets);
    });

    // Clean up: leave game and disconnect socket on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leaveGame", { gameId: id, userId });
        socketRef.current.disconnect();
      }
    };
  }, [stake]);

  // Generate 5x5 bingo card with selected number centered
  const generateCard = (selected) => {
    let numbers = Array.from({ length: 100 }, (_, i) => i + 1);
    // Remove the selected number to avoid duplicates
    numbers = numbers.filter((num) => num !== selected);

    // Shuffle remaining numbers
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    // Pick 24 numbers + selected number = 25 total for 5x5
    const cardNumbers = numbers.slice(0, 24);
    cardNumbers.splice(12, 0, selected); // Center of 5x5

    // Create 5 rows of 5 numbers
    const card = [];
    for (let i = 0; i < 5; i++) {
      card.push(cardNumbers.slice(i * 5, i * 5 + 5));
    }

    setBingoCard(card);
  };

  // Handle when user clicks a ticket number
  const handleNumberClick = (number) => {
    if (gameStarted) return; // Prevent changing after start

    setSelectedNumber(number);
    setCartelaId(number);
    generateCard(number);
    setShowCartelaModal(true);

    const telegramUser = JSON.parse(localStorage.getItem("telegramUser"));
    const userId = telegramUser?.id || "anonymous";

    socketRef.current.emit("selectTicketNumber", {
      gameId,
      userId,
      number,
    });
  };

  // Start game: deduct balance and navigate to Call page
  const handleStartGame = () => {
    if (!selectedNumber) {
      setShowModal(true);
      return;
    }

    const currentBalance = parseFloat(localStorage.getItem("balance") ?? "0");
    const newWallet = currentBalance - stake;

    if (newWallet < 0) {
      alert("Not enough balance!");
      return;
    }

    localStorage.setItem("balance", newWallet);
    setWallet(newWallet);
    setGameStarted(true);
    navigate("/call", {
      state: {
        card: bingoCard,
        stake: stake,
        gameId: gameId,
        cartelaNumber: cartelaId,
      },
    });
  };

  // Helper: Check if a number is selected by any user
  // Returns { isSelected: boolean, selectedBy: userId[] }
  const isNumberSelected = (num) => {
    const selectedBy = [];
    for (const [userId, numbers] of Object.entries(allTicketSelections)) {
      if (numbers.includes(num)) {
        selectedBy.push(userId);
      }
    }
    return { isSelected: selectedBy.length > 0, selectedBy };
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #4B0082, #6A5ACD)",
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
            gridTemplateColumns: "repeat(8, 1fr)",
            gap: "6px",
            margin: "10px 0",
            background: "linear-gradient(135deg, #6a5acd, #9370db)",
            padding: "15px",
            borderRadius: "12px",
          }}
        >
          {Array.from({ length: 100 }, (_, i) => i + 1).map((num) => {
            const { isSelected, selectedBy } = isNumberSelected(num);
            const telegramUser = JSON.parse(localStorage.getItem("telegramUser"));
            const currentUserId = telegramUser?.id || "anonymous";

            const isCurrentUserSelected = selectedBy.includes(currentUserId);

            return (
              <button
                key={num}
                onClick={() => handleNumberClick(num)}
                disabled={isSelected && !isCurrentUserSelected}
                style={{
                  padding: "8px",
                  background: isCurrentUserSelected
                    ? "#00C9FF"
                    : isSelected
                    ? "#FF5722"
                    : "#333",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "12px",
                  cursor:
                    isSelected && !isCurrentUserSelected
                      ? "not-allowed"
                      : "pointer",
                  transition: "all 0.2s ease-in-out",
                }}
                title={
                  isSelected
                    ? selectedBy.length > 1
                      ? "Selected by multiple players"
                      : "Selected by another player"
                    : "Click to select"
                }
              >
                {num}
              </button>
            );
          })}
        </div><button
          onClick={handleStartGame}
          disabled={gameStarted}
          style={{
            marginTop: "20px",
            width: "100%",
            padding: "12px",
            background: gameStarted ? "#888" : "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontWeight: "bold",
            cursor: gameStarted ? "not-allowed" : "pointer",
            fontSize: "16px",
            transition: "background 0.3s",
          }}
        >
          🎮 Start Game
        </button>
      </div>

      {/* Modal: Please select a ticket */}
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

      {/* Modal: Cartela popup */}
      {showCartelaModal && (
        <div className="cartela-overlay" onClick={() => setShowCartelaModal(false)}>
          <div className="cartela-container" onClick={(e) => e.stopPropagation()}>
            <h3 className="cartela-title">(Cartela: #{cartelaId})</h3>

            <div className="cartela-grid">
              {bingoCard.flat().map((num, idx) => (
                <div
                  key={idx}
                  className={`cartela-cell ${num === selectedNumber ? "selected" : ""}`}
                >
                  {num === selectedNumber ? "*" : num}
                </div>
              ))}
            </div>

            <button onClick={() => setShowCartelaModal(false)} className="cartela-close">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BingoBoard;