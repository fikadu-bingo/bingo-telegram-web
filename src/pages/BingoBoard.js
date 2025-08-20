import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import io from "socket.io-client";
import "../components/CartelaModal.css";

const SOCKET_SERVER_URL = "https://bingo-server-rw7p.onrender.com";

const generateGameId = () => {
  const prefix = "A";
  const num = Math.floor(Math.random() * 900) + 100;
  return prefix + num;
};

function BingoBoard() {
  const location = useLocation();
  const navigate = useNavigate();

  const stake = location.state?.stake ?? 0;
  const initialBalance = parseFloat(localStorage.getItem("balance") ?? "200");
  const [wallet, setWallet] = useState(initialBalance);
  const [gameId, setGameId] = useState("");

  // Selected ticket number & server ticket
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [bingoCard, setBingoCard] = useState([]);
  const [cartelaId, setCartelaId] = useState("");

  // Game state & modals
  const [gameStarted, setGameStarted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showCartelaModal, setShowCartelaModal] = useState(false);

  const socketRef = useRef();
  const userIdRef = useRef(null);

  useEffect(() => {
    const id = generateGameId();
    setGameId(id);

    socketRef.current = io(SOCKET_SERVER_URL, { transports: ["websocket"] });

    const telegramUser = JSON.parse(localStorage.getItem("telegramUser"));
    const userId = telegramUser?.id ?? "anonymous";
    userIdRef.current = userId;

    // Join game and request server ticket
    socketRef.current.emit("joinGame", { userId, stake });

    // Listen for server-assigned ticket
    socketRef.current.on("ticketAssigned", (ticket, selected) => {
      setBingoCard(ticket);
      setSelectedNumber(selected || null);
      setCartelaId(selected || null);
      setShowCartelaModal(true);
    });

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leaveGame", { userId, stake });
        socketRef.current.disconnect();
      }
    };
  }, [stake]);

  const handleStartGame = () => {
    if (!selectedNumber) {
      setShowModal(true);
      return;
    }

    if (wallet < stake) {
      alert("Not enough balance!");
      return;
    }

    const newWallet = wallet - stake;
    setWallet(newWallet);
    localStorage.setItem("balance", newWallet);
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

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #82007eff, #ba5acdff)",
        display: "flex",
        flexDirection: "column",
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
        }}
      >
        <img src={logo} alt="Logo" style={{ width: "120px", marginBottom: "10px" }} />

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
          <div>Wallet: Br{wallet.toFixed(2)}</div>
          <div>Game ID: {gameId}</div>
          <div>Stake: Br{stake}</div>
        </div>

        <h4 style={{ margin: "10px 0", color: "#333" }}>Your Bingo Ticket</h4>
        <button
          onClick={() => setShowCartelaModal(true)}
          style={{
            padding: "10px",
            borderRadius: "8px",
            background: "#4CAF50",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          View Ticket
        </button>

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
            background: "rgba(0,0,0,0.7)",
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
            <p style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "20px" }}>
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
              {bingoCard.map((row, rIdx) =>
                row.map((num, cIdx) => (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    className={`cartela-cell ${num === selectedNumber ? "selected" : ""}`}
                  >
                    {num === selectedNumber ? "*" : num}
                  </div>
                ))
              )}
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