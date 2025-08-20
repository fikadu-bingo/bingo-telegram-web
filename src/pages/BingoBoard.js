import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import io from "socket.io-client";
import "../components/CartelaModal.css";

const SOCKET_SERVER_URL = "https://bingo-server-rw7p.onrender.com";

// Helper to generate Game IDs like A001, A002...
const generateGameId = () => {
  const prefix = "A";
  const num = Math.floor(Math.random() * 900) + 100; // 100 - 999
  return prefix + num;
};

function BingoBoard() {
  const location = useLocation();
  const navigate = useNavigate();

  const stake = location.state?.stake ?? 0;
  const initialBalance = parseFloat(localStorage.getItem("balance") ?? "200");
  const [wallet, setWallet] = useState(initialBalance);
  const [gameId, setGameId] = useState("");
  const [balance] = useState(initialBalance);

  // Selected ticket number & card
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [bingoCard, setBingoCard] = useState([]);
  const [cartelaId, setCartelaId] = useState("");

  // All users’ ticket selections
  const [allTicketSelections, setAllTicketSelections] = useState({});

  // Game status
  const [gameStarted, setGameStarted] = useState(false);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showCartelaModal, setShowCartelaModal] = useState(false);

  // Socket & user id refs
  const socketRef = useRef();
  const userIdRef = useRef(null);

  useEffect(() => {
    // Generate random gameId on mount
    const id = generateGameId();
    setGameId(id);

    // Connect socket
    socketRef.current = io(SOCKET_SERVER_URL, { transports: ["websocket"] });

    const telegramUser = JSON.parse(localStorage.getItem("telegramUser"));
    const userId = telegramUser?.id ?? "anonymous";
    userIdRef.current = userId;

    // Join socket room/game
    socketRef.current.emit("joinGame", { userId, username: telegramUser?.username ?? "Player", stake });

    // Listen for live ticket updates from server
    socketRef.current.on("ticketNumbersUpdated", (tickets) => {
      setAllTicketSelections(tickets);

      // Reset selection if our number is deselected
      if (selectedNumber !== null) {
        const userTickets = tickets[userIdRef.current] ?? [];
        if (!userTickets.includes(selectedNumber)) {
          setSelectedNumber(null);
          setBingoCard([]);
          setCartelaId("");
        }
      }
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leaveGame", { userId, stake });
        socketRef.current.disconnect();
      }
    };
  }, [stake, selectedNumber]);

  // Generate 5x5 bingo card with selected number in center
  const generateCard = (selected) => {
    // Numbers 1 to 75
    let numbers = Array.from({ length: 75 }, (_, i) => i + 1);
    numbers = numbers.filter((num) => num !== selected);

    // Shuffle
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    const cardNumbers = numbers.slice(0, 24);
    cardNumbers.splice(12, 0, selected); // center

    const card = [];
    for (let i = 0; i < 5; i++) {
      card.push(cardNumbers.slice(i * 5, i * 5 + 5));
    }

    setBingoCard(card);
  };

  // When user clicks a number to select ticket
  const handleNumberClick = (number) => {
    if (gameStarted) return;

    const userId = userIdRef.current;

    // If user had selected a different ticket before, deselect that first on server
    if (selectedNumber !== null && selectedNumber !== number) {
      socketRef.current.emit("deselectTicketNumber", {
        userId,
        oldNumber: selectedNumber,
      });
    }

    setSelectedNumber(number);
    setCartelaId(number);
    generateCard(number);
    setShowCartelaModal(true);

    // Notify server of new selection
    socketRef.current.emit("selectTicketNumber", {
      userId,
      number,
    });
  };
  // Start the game: deduct stake, update balance, and navigate to Call page
  const handleStartGame = () => {
    if (!selectedNumber) {
      setShowModal(true);
      return;
    }

    if (wallet < stake) {
      alert("Not enough balance!");
      return;
    }

    const Wallet = balance - stake;
    setWallet(Wallet);
    localStorage.setItem("balance", Wallet);
    setGameStarted(true);

    navigate("/call", {
      state: {
        card: bingoCard,
        stake,
        gameId,
        cartelaNumber: cartelaId,
        userId: userIdRef.current,
      },
    });
  };

  // Check if number is selected by any user
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
        background: "linear-gradient(135deg, #82007eff, #ba5acdff)",
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
          style={{ width: "120px", marginBottom: "10px" }}
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
          <div>Wallet: Br{wallet-stake.toFixed(2)}</div>
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
          {Array.from({ length: 200 }, (_, i) => i + 1).map((num) => {
            const { isSelected, selectedBy } = isNumberSelected(num);
            const currentUserId = userIdRef.current || "anonymous";
            const isCurrentUserSelected = selectedBy.includes(currentUserId);

            return (
              <button
                key={num}
                onClick={() => handleNumberClick(num)}
                disabled={isSelected && !isCurrentUserSelected}
                style={{
                  padding: "8px",
                  background: isCurrentUserSelected
                    ? "#f7ad2eff"
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
        </div>
        <button
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
        <div
          className="cartela-overlay"
          onClick={() => setShowCartelaModal(false)}
        >
          <div className="cartela-container" onClick={(e) => e.stopPropagation()}>
            <h3 className="cartela-title">(Cartela: #{cartelaId})</h3>

            <div className="cartela-grid">
              {bingoCard.flat().map((num, idx) => (
                <div
                  key={idx}
                  className={`cartela-cell ${
                    num === selectedNumber ? "selected" : ""
                  }`}
                >
                  {num === selectedNumber ? "*" : num}
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowCartelaModal(false)}
              className="cartela-close"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BingoBoard;