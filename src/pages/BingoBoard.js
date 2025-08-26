import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import "../components/CartelaModal.css";
import "./BingoBoard.css";
import CartelaModal from "../components/CartelaModal";

const SOCKET_SERVER_URL = "https://bingo-server-rw7p.onrender.com";

// Helper to generate Game IDs like A001, A002...
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

    // Only regenerate card if the ticket number changed
    if (myNumber !== selectedNumber) {
      setSelectedNumber(myNumber);
      setCartelaId(myNumber);

      // Only generate card here if the user hasn't already generated it
      if (!bingoCard || bingoCard.length === 0) {
        const card = generateCard();
        setBingoCard(card);
      }
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
    <div className="bb-page">
      <div className="bb-wallet-bar">
        <div>Wallet: Br{(wallet - stake).toFixed(2)}</div>
        <div>Game ID: {gameId}</div>
        <div>Stake: Br{stake}</div>
      </div>

      <div className="bb-board-container">
        <h4>Select a Lucky Ticket Number</h4>

        <div className="bb-numbers">
          {Array.from({ length: 100 }, (_, i) => i + 1).map((num) => {
            const { isSelected, selectedBy } = isNumberSelected(num);
            const currentUserId = userIdRef.current || "anonymous";
            const isCurrentUserSelected = selectedBy.includes(currentUserId);

            return (
              <button
                key={num}
                onClick={() => handleNumberClick(num)}
                disabled={isSelected && !isCurrentUserSelected}
                className={`bb-num ${
                  isCurrentUserSelected ? "bb-num-me" : ""
                }`}
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
          className="bb-start-btn"
        >
          🎮 Start Game
        </button>
      </div>

<CartelaModal
  isOpen={showCartelaModal}
  onClose={() => setShowCartelaModal(false)}
  cartelaData={bingoCard}
  title={`Cartela #${cartelaId}`}
/>
    </div>
  );
}

export default BingoBoard;