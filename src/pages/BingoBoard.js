import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import bg from "../assets/bg.jpg";
import io from "socket.io-client";
import "../components/CartelaModal.css";
import "./BingoBoard.css";
import CartelaModal from "../components/CartelaModal";

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

  const [selectedNumber, setSelectedNumber] = useState(null);
  const [bingoCard, setBingoCard] = useState([]);
  const [cartelaId, setCartelaId] = useState("");

  const [allTicketSelections, setAllTicketSelections] = useState({});
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

    socketRef.current.emit("joinGame", { userId, stake, ticket: [] });

  socketRef.current.on("ticketNumbersUpdated", (tickets) => {
  setAllTicketSelections(tickets);
  const myNumbers = tickets[userIdRef.current] ?? [];
  if (myNumbers.length > 0) {
    const myNumber = myNumbers[0];
    if (myNumber !== selectedNumber) {
      setSelectedNumber(myNumber);
      setCartelaId(myNumber);
      const card = generateCard();
      setBingoCard(card);
      // ✅ no setShowCartelaModal here
    }
  } else {
    setSelectedNumber(null);
    setCartelaId("");
    setBingoCard([]);
  }
});

    socketRef.current.on("ticketAssigned", ({ ticket }) => {
      console.log("Server assigned ticket:", ticket);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leaveGame", { gameId: id, userId, stake });
        socketRef.current.disconnect();
      }
    };
  }, [stake]);

const generateCard = () => {
  const columns = [
    Array.from({ length: 15 }, (_, i) => i + 1),
    Array.from({ length: 15 }, (_, i) => i + 16),
    Array.from({ length: 15 }, (_, i) => i + 31),
    Array.from({ length: 15 }, (_, i) => i + 46),
    Array.from({ length: 15 }, (_, i) => i + 61),
  ];

  const card = [];
  for (let row = 0; row < 5; row++) {
    const rowNumbers = [];
    for (let col = 0; col < 5; col++) {
      if (row === 2 && col === 2) {
        rowNumbers.push("★");
      } else {
        const nums = columns[col];
        const idx = Math.floor(Math.random() * nums.length);
        rowNumbers.push(nums.splice(idx, 1)[0]);
      }
    }
    card.push(rowNumbers);
  }
  return card;
};

 const handleNumberClick = (number) => {
  if (gameStarted) return;
  const userId = userIdRef.current;

  if (selectedNumber !== null && selectedNumber !== number) {
    socketRef.current.emit("deselectTicketNumber", {
      stake,
      userId,
      oldNumber: selectedNumber,
    });
  }

  // ✅ generate a new card only once for this ticket
  const newCard = generateCard();
  setBingoCard(newCard);
  setSelectedNumber(number);
  setCartelaId(number);
  setShowCartelaModal(true);

  socketRef.current.emit("selectTicketNumber", {
    stake,
    userId,
    number,
  });
};

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

  const isNumberSelected = (num) => {
    const selectedBy = [];
    for (const [userId, numbers] of Object.entries(allTicketSelections)) {
      if (numbers.includes(num)) selectedBy.push(userId);
    }
    return { isSelected: selectedBy.length > 0, selectedBy };
  };

  return (
    <div
      style={{
        minHeight: "100vh",
         background: "#047a8f", // solid color
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        padding: "20px",
      }}
    >
  <div className="wallet-bar">
    <div>Wallet: Br{(wallet - stake).toFixed(2)}</div>
    <div>Game ID: {gameId}</div>
    <div>Stake: Br{stake}</div>
  </div>


   <div className="board-container">
       
  

        <h4 style={{ margin: "10px 0" }}>Select a Lucky Ticket Number</h4>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(8, 1fr)",
            gap: "6px",
            margin: "10px 0",
            background: "rgba(0,0,0,0.3)",
            padding: "15px",
            borderRadius: "12px",
            justifyContent: "center"
          }}
        >
         {Array.from({ length: 100 }, (_, i) => i + 1).map((num) => {
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
      ? "#065f6f"        // slightly darker than background for selected
      : isSelected
      ? "#065f6f"        // slightly darker for already selected
      : "#047a8f",       // default matches the board background
    color: "#fff",        // bold white text
    fontWeight: "bold",   // make text bold
    border: "1px solid #025a63", // subtle border to separate buttons
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
<CartelaModal
  show={showCartelaModal}
  onClose={() => setShowCartelaModal(false)}
  cartelaId={cartelaId}
  card={bingoCard}
/>

    </div>
  );
}

export default BingoBoard; 