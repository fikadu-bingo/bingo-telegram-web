import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import logo from "../assets/logo.png";
import WinModal from "../components/WinModal";
import "./Call.css";

// Helper functions
function getBingoLetter(number) {
  if (number >= 1 && number <= 15) return "B";
  if (number >= 16 && number <= 30) return "I";
  if (number >= 31 && number <= 45) return "N";
  if (number >= 46 && number <= 60) return "G";
  if (number >= 61 && number <= 75) return "O";
  return "";
}

function formatBingoNumber(number) {
  return `${getBingoLetter(number)}${number}`;
}

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

  const userId =
    stateUserId ?? localStorage.getItem("telegram_id") ?? `guest_${Date.now()}`;
  const username =
    stateUsername ?? localStorage.getItem("firstName") ?? "User";

  const [calledNumbers, setCalledNumbers] = useState([]); // array of "B12" etc
  const [currentNumber, setCurrentNumber] = useState(null); // "B12"
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

    socket.current = io("https://bingo-server-rw7p.onrender.com", {
      transports: ["websocket"],
    });

    socket.current.emit("joinGame", {
      userId,
      username,
      stake,
      ticket: playerCard,
    });

    socket.current.on("playerCountUpdate", (count) => setPlayers(count));

    socket.current.on("countdownUpdate", (time) => {
      setCountdown(time);
      if (time === 0) setGameStarted(true);
    });

    socket.current.on("countdownStopped", () => {
      setCountdown(null);
      setGameStarted(false);
    });

    socket.current.on("numberCalled", (number) => {
      const formatted = formatBingoNumber(number); // "B12"
      setCurrentNumber(formatted);
      setCalledNumbers((prev) =>
        prev.includes(formatted) ? prev : [...prev, formatted]
      );
    });

    socket.current.on("winAmountUpdate", (amount) => setWinAmount(amount));

    socket.current.on("gameStarted", () => setGameStarted(true));

    socket.current.on(
      "gameWon",
      ({ userId: winnerId, username: winnerUsername, prize, balances }) => {
        const numericPrize = Number(prize) || 0;

        try {
          const myUserId = userId;
          if (
            balances &&
            typeof balances === "object" &&
            balances[myUserId] !== undefined
          ) {
            const updatedBalance = Number(balances[myUserId]);
            if (!isNaN(updatedBalance)) {
              localStorage.setItem("balance", updatedBalance);
              setWinAmount(updatedBalance);
            }
          }
        } catch (err) {
          console.error("Failed to update local balance on gameWon:", err);
        }

        setWinnerInfo({
          userId: winnerId,
          username: winnerUsername,
          prize: numericPrize,
        });
        setShowPopup(true);
      }
    );

    socket.current.on("balanceChange", (payload) => {
      try {
        if (!payload || !payload.balances) return;
        const newBalance = Number(payload.balances[userId]);
        if (!isNaN(newBalance)) {
          localStorage.setItem("balance", newBalance);
          if (!winnerInfo) setWinAmount(newBalance);
        }
      } catch (e) {
        console.error("Failed to process balanceChange:", e);
      }
    });
    socket.current.on("gameReset", () => {
      setCalledNumbers([]);
      setCurrentNumber(null);
      setCountdown(null);
      setGameStarted(false);
      setWinnerInfo(null);
      setShowPopup(false);
    });

    return () => {
      if (socket.current) {
        socket.current.emit("leaveGame", { userId });
        socket.current.disconnect();
        socket.current = null;
      }
    };
  }, [stake, userId, username, playerCard, navigate, winnerInfo]);

  const getMarkedCartela = () =>
    playerCard.map((row, rowIndex) =>
      row.map((num, colIndex) => {
        const isCenter = rowIndex === 2 && colIndex === 2;
        const marked =
          isCenter || calledNumbers.includes(formatBingoNumber(num));
        return { num, marked, isCenter };
      })
    );

  // last 4 (newest first)
  const lastFour = calledNumbers.slice(-4).reverse();

  return (
    <div className="container">
      {/* Logo */}
      <div className="logo-container">
        <img src={logo} alt="Logo" className="logo" />
      </div>

      {/* Top Menu */}
      <div className="top-menu">
        <div>Players: {players}</div>
        <div>Bet: Br{stake}</div>
        <div>Win: Br{winAmount}</div>
        <div>Call: {calledNumbers.length}</div>
      </div>

      <div className="main-content">
        {/* ---------------- Leftside Board ---------------- */}
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
            {Array.from({ length: 75 }, (_, i) => i + 1).map((num) => {
              const letterClass = getBingoLetter(num).toLowerCase(); // b/i/n/g/o
              const isMarked = calledNumbers.includes(formatBingoNumber(num));
              return (
                <div
                  key={num}
                  className={`number-box ${letterClass} ${
                    isMarked ? "marked" : "unmarked"
                  }`}
                >
                  {num}
                </div>
              );
            })}
          </div>
        </div>

        {/* ---------------- Cartela Board with title ---------------- */}
        <div className="cartela-wrapper">
          {/* Title above cartela, outside its background */}
          <h4 className="cartela-title">Cartela: #{cartelaNumber}</h4>

          {/* Big Current Number Ball (glossy + colored by letter) */}
          <div
            className={`current-number ${
              currentNumber
                ? `letter-${currentNumber[0].toLowerCase()}`
                : ""
            }`}
          >
            {currentNumber ?? "--"}
          </div>

          {/* Last 4 balls bar (glossy balls in red rounded rectangle, right->left) */}
          <div className="last-four-bar">
            {lastFour.map((fmt, idx) => (
              <div
                key={`${fmt}-${idx}`}
                className={`small-ball letter-${fmt[0].toLowerCase()} slide-in`}
                title={fmt}
              >
                {fmt}
              </div>
            ))}
          </div>

          <div className="cartela">
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
              {playerCard.flat().map((num, idx) => {const row = Math.floor(idx / 5);
                const col = idx % 5;
                const isCenter = row === 2 && col === 2;
                const marked =
                  isCenter || calledNumbers.includes(formatBingoNumber(num));
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
          </div>

          {/* Leave Button (outside cartela background) */}
          <div className="buttons">
            <button
              onClick={() => navigate("/")}
              className="action-btn leave-button"
              disabled={gameStarted && winnerInfo === null}
              title={
                gameStarted && winnerInfo === null
                  ? "You can't leave during an active game"
                  : ""
              }
            >
              🚪 Leave
            </button>
          </div>
        </div>

        {/* Countdown bubble (kept; styling in CSS) */}
        {countdown !== null && !gameStarted && (
          <div className="countdown-circle">
            <div style={{ fontSize: "12px" }}>Wait</div>
            <div>{countdown > 0 ? countdown : "0"}</div>
          </div>
        )}
      </div>

      {/* Winner Modal */}
      {showPopup && winnerInfo && (
        <WinModal
          username={winnerInfo.username}
          amount={winnerInfo.prize}
          cartela={getMarkedCartela()}
          cartelaNumber={cartelaNumber}
          onPlayAgain={() => {
            setWinnerInfo(null);
            setShowPopup(false);
            const updatedBalance = parseFloat(
              localStorage.getItem("balance") ?? 0
            );
            setWinAmount(updatedBalance);
            navigate("/");
          }}
        />
      )}
    </div>
  );
}

export default Call;