import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import logo from "../assets/logo.png";
import WinModal from "../components/WinModal";
import "./Call.css";

function Call() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    card,
    stake,
    gameId,
    cartelaNumber,
    username: stateUsername,
    userId: stateUserId,
  } = location.state ?? {};

  // Prefer passed userId/username, else from localStorage fallback
  const userId = stateUserId ?? localStorage.getItem("telegram_id") ?? `guest_${Date.now()}`;
  const username = stateUsername ?? localStorage.getItem("firstName") ?? "User";

  const [calledNumbers, setCalledNumbers] = useState([]);
  const [currentNumber, setCurrentNumber] = useState(null);
  const [playerCard, setPlayerCard] = useState(card ?? []);
  const [countdown, setCountdown] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [winnerInfo, setWinnerInfo] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [players, setPlayers] = useState(1);
  const [winAmount, setWinAmount] = useState(0);

  const socket = useRef(null);

  useEffect(() => {
    if (!stake || !userId) {
      alert("Invalid game data. Returning to home...");
      navigate("/");
      return;
    }

    // Connect socket
    socket.current = io("https://bingo-server-rw7p.onrender.com", {
      transports: ["websocket"],
    });

    // Join game with userId, username, stake, and ticket (player card)
    socket.current.emit("joinGame", { userId, username, stake, ticket: playerCard });

    // Listen for updated player list
    socket.current.on("playerCountUpdate", (count) => {
      setPlayers(count);
    });

    // Countdown updates
    socket.current.on("countdownUpdate", (time) => {
      setCountdown(time);
      if (time === 0) setGameStarted(true);
    });

    socket.current.on("countdownStopped", () => {
      setCountdown(null);
      setGameStarted(false);
    });

    // Called number event
    socket.current.on("numberCalled", (number) => {
      setCurrentNumber(number);
      setCalledNumbers((prev) => (prev.includes(number) ? prev : [...prev, number]));
    });

    // Win amount update
    socket.current.on("winAmountUpdate", (amount) => {
      setWinAmount(amount);
    });

    // Game started event
    socket.current.on("gameStarted", () => {
      setGameStarted(true);
    });

    // Winner announcement

// Winner announcement
// Winner announcement
socket.current.on("gameWon", ({ userId: winnerId, username: winnerUsername, prize, balances }) => {
  const numericPrize = Number(prize) || 0;

  // Update local balance for this client based on balances object
  try {
    const myUserId = userId; // current client
    if (balances && typeof balances === "object" && balances[myUserId] !== undefined) {
      const updatedBalance = Number(balances[myUserId]);
      if (!isNaN(updatedBalance)) {
        localStorage.setItem("balance", updatedBalance);
        setWinAmount(updatedBalance); // optional: keep UI consistent
      }
    }
  } catch (err) {
    console.error("Failed to update local balance on gameWon:", err);
  }

  // Always show WinModal with winner info
  setWinnerInfo({
    userId: winnerId,
    username: winnerUsername,
    prize: numericPrize,
  });
  setShowPopup(true);
});

// General balance updates from server (e.g., for losers, deposit, cashout)
socket.current.on("balanceChange", (payload) => {
  try {
    if (!payload || !payload.balances) return;

    const myUserId = userId; // current client
    const newBalance = Number(payload.balances[myUserId]);
    if (!isNaN(newBalance)) {
      localStorage.setItem("balance", newBalance);
      // Only update winAmount if no winner modal is currently shown
      if (!winnerInfo) setWinAmount(newBalance);
    }
  } catch (e) {
    console.error("Failed to process balanceChange:", e);
  }
});
    // Reset game UI
    socket.current.on("gameReset", () => {
      setCalledNumbers([]);
      setCurrentNumber(null);
      setCountdown(null);
      setGameStarted(false);
      setWinnerInfo(null);
      setShowPopup(false);
    });

    // Cleanup on unmount
    return () => {
      if (socket.current) {
        socket.current.emit("leaveGame", { userId });
        socket.current.disconnect();
        socket.current = null;
      }
    };
  }, [stake, userId, username, playerCard, navigate]);
  // Prepare marked cartela for WinModal display
  const getMarkedCartela = () => {
    return playerCard.map((row, rowIndex) =>
      row.map((num, colIndex) => {
        const isCenter = rowIndex === 2 && colIndex === 2;
        const marked = isCenter || calledNumbers.includes(num);
        return { num, marked, isCenter };
      })
    );
  };

  const lastThree = calledNumbers.slice(-3).reverse();

  return (
    <div className="container">
      <div className="logo-container">
        <img src={logo} alt="Logo" className="logo" />
      </div>
      <div className="top-menu">
        <div>Players: {players}</div>
        <div>Bet: Br{stake}</div>
        <div>Win: Br{winAmount}</div>
        <div>Call: {calledNumbers.length}</div>
      </div>

      <div className="main-content">
        <div className="board">
          <div className="bingo-header-row">
            {["B", "I", "N", "G", "O"].map((letter) => (
              <div
                key={letter}
                className={`bingo-letter bingo-${letter.toLowerCase()}`}
              >
                {letter}
              </div>
            ))}
          </div>
          <div className="board-grid">
            {Array.from({ length: 100 }, (_, i) => i + 1).map((num) => (
              <div
                key={num}
                className={`number-box ${
                  calledNumbers.includes(num) ? "marked" : "unmarked"
                }`}
              >
                {num}
              </div>
            ))}
          </div>
        </div>

        <div className="cartela">
          {countdown !== null && !gameStarted && (
            <div className="circle">
              <div style={{ fontSize: "12px" }}>Wait</div>
              <div>{countdown > 0 ? countdown : "0"}</div>
            </div>
          )}

          <div className="last-three">
            {lastThree.map((num, idx) => (
              <div key={idx}>{num}</div>
            ))}
          </div>

          <div className="current-number">{currentNumber ?? "--"}</div>
          <h4 style={{ textAlign: "center" }}>Cartela: #{cartelaNumber}</h4>

          <div className="bingo-header-row">
            {["B", "I", "N", "G", "O"].map((letter) => (
              <div
                key={letter}
                className={`bingo-letter bingo-${letter.toLowerCase()}`}
              >
                {letter}
              </div>
            ))}
          </div>

          <div className="cartela-grid">
            {playerCard.flat().map((num, idx) => {
              const row = Math.floor(idx / 5);
              const col = idx % 5;
              const isCenter = row === 2 && col === 2;
              const marked = isCenter || calledNumbers.includes(num);
              return (
                <div
                  key={idx}
                  className={`number-box ${marked ? "marked" : "unmarked"}`}
                >
                  {isCenter ? "*" : num}
                </div>
              );
            })}
          </div>

          <div className="buttons">
            <button
              onClick={() => navigate("/")}
              className="action-btn"
              disabled={gameStarted && winnerInfo === null}
              title={gameStarted && winnerInfo === null ? "You can't leave during an active game" : ""}
            >
              🚪 Leave
            </button>
          </div>
        </div>
      </div>

      {showPopup && winnerInfo && (
        <WinModal
          username={winnerInfo.username}
          amount={winnerInfo.prize}
          cartela={getMarkedCartela()}
          cartelaNumber={cartelaNumber}
          onPlayAgain={() => {
            setWinnerInfo(null);
            setShowPopup(false);
               // TODO: refresh balance display after play again
    const updatedBalance = parseFloat(localStorage.getItem("balance") ?? 0);
    setWinAmount(updatedBalance); // optional: update state so HomePage reflects it
    navigate("/");
          }}
        />
      )}
    </div>
  );
}

export default Call;