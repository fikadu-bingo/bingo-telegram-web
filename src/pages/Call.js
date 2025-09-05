import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import WinModal from "../components/WinModal";
import "./Call.css";

// ------------------ Helper functions ------------------
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
  const { card, stake, cartelaNumber, username: stateUsername, userId: stateUserId } =
    location.state ?? {};

  const userId =
    stateUserId ?? localStorage.getItem("telegram_id") ?? `guest_${Date.now()}`;
  const username =
    stateUsername ?? localStorage.getItem("firstName") ?? "User";
// Full ticket object from server: { grid, cartelaNumber }
const [playerTicket, setPlayerTicket] = useState(card ? { grid: card, cartelaNumber } : null);
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [currentNumber, setCurrentNumber] = useState(null);
  const [playerCard, setPlayerCard] = useState(card ?? []);
  const [countdown, setCountdown] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [winnerInfo, setWinnerInfo] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [players, setPlayers] = useState(1);
  const [winAmount, setWinAmount] = useState(0);
  const [rollingNumbers, setRollingNumbers] = useState([]);
  const [markedNumbers, setMarkedNumbers] = useState([]);
  const [blinkNumbers, setBlinkNumbers] = useState([]);
  const [muted, setMuted] = useState(false);

  const socket = useRef(null);
  const audioRef = useRef(null);

// ------------------ Play audio ------------------
const playAudio = (formattedNumber) => {

  if (!formattedNumber) return;

  // If audioRef exists and is playing, stop it first
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.currentTime = 0; // reset to start
  }

  // If muted, do not play any audio
  if (muted) return;

  // Create new Audio object and play
  const audioPath = `/audio/bingo_calls/${formattedNumber}.mp3`;
  audioRef.current = new Audio(audioPath);
  audioRef.current.volume = 1; // ensure volume is full when unmuted
  audioRef.current.play().catch((err) => console.warn("Audio play failed:", err));
};

// ------------------ Optional: Pause any playing audio when muted changes ------------------
useEffect(() => {
  if (muted && audioRef.current) {
    audioRef.current.pause();
  }
}, [muted]);

  // ------------------ Socket Setup ------------------
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
      ticket: playerTicket,
    });
 // Receive assigned ticket from server
  socket.current.on("ticketAssigned", ({ ticket, cartelaNumber }) => {
    setPlayerTicket({ grid: ticket, cartelaNumber }); // full object
    setPlayerCard(ticket); // only grid for rendering
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
      if (number < 1 || number > 75) return;
      const formatted = formatBingoNumber(number);

      setCurrentNumber(formatted);
      setCalledNumbers((prev) =>
        prev.includes(formatted) ? prev : [...prev, formatted]
      );
      setRollingNumbers((prev) => {
        const updated = [...prev, formatted];
        if (updated.length > 4) updated.shift();
        return updated;
      });

      // Play audio
      playAudio(formatted);

      // Blink effect for 2 seconds
      setBlinkNumbers((prev) => [...prev, formatted]);
      setTimeout(() => {
        setBlinkNumbers((prev) =>
          prev.filter((num) => num !== formatted)
        );
      }, 2000);
    });

    socket.current.on("winAmountUpdate", (amount) => setWinAmount(amount));
    socket.current.on("gameStarted", () => setGameStarted(true));
    socket.current.on(
      "gameWon",
      ({ userId: winnerId, username: winnerUsername, prize,winnerCartela,cartelaNumber }) => {
        const numericPrize = Number(prize) || 0;
        setWinnerInfo({
          userId: winnerId,
          username: winnerUsername,
          prize: numericPrize,
           cartela: winnerCartela,
           cartelaNumber
        });
        setShowPopup(true);
        // Redirect all users automatically after 3 seconds
  setTimeout(() => {
    navigate("/");
  }, 9000); // adjust delay as needed
      });

    socket.current.on("bingoSuccess", ({ winnerId, username, prize }) => {
      setWinnerInfo({ userId: winnerId, username, prize });
      setShowPopup(true);
    });

    socket.current.on("bingoFail", ({ message }) => {
      alert(message || "Invalid Bingo claim!");
    });

    socket.current.on("winnerDeclared", ({ winnerId, username, prize, winnerCartela }) => {
      if (winnerId !== userId) {
        setWinnerInfo({ userId: winnerId, username, prize, cartela: winnerCartela, });
        setShowPopup(true);

        // Redirect automatically for all other users
    setTimeout(() => {
      navigate("/");
    }, 9000);
      }
    });

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
      setRollingNumbers([]);
      setMarkedNumbers([]);
      setBlinkNumbers([]);
    });

    return () => {
      if (socket.current) {
        socket.current.emit("leaveGame", { userId });
        socket.current.disconnect();
        socket.current = null;
      }
    };
  }, [stake, userId, username, playerCard, navigate, winnerInfo]);

  // ------------------ Bingo Check ------------------
  const checkBingo = () => {
    const grid = playerCard;
    const allMarked = (num) =>
      markedNumbers.includes(formatBingoNumber(num)) || num === "*";

    // Rows
    for (let r = 0; r < 5; r++) if (grid[r].every(allMarked)) return true;
    // Columns
    for (let c = 0; c < 5; c++) if (grid.every((row) => allMarked(row[c])))
      return true;
    // Diagonals
    const diag1 = [0, 1, 2, 3, 4].every((i) => allMarked(grid[i][i]));
    const diag2 = [0, 1, 2, 3, 4].every((i) =>
      allMarked(grid[i][4 - i])
    );
    return diag1 || diag2;
  };

  const handleMarkNumber = (num) => {
    const formatted = formatBingoNumber(num);
    if (!calledNumbers.includes(formatted)) return;
    setMarkedNumbers((prev) =>
      prev.includes(formatted) ? prev : [...prev, formatted]
    );
  };

  const getMarkedCartela = () =>
    playerCard.map((row, rowIndex) =>
      row.map((num, colIndex) => {
        const isCenter = rowIndex === 2 && colIndex === 2;
        const marked =
          isCenter || markedNumbers.includes(formatBingoNumber(num));
        return { num, marked, isCenter };
      })
    );

  // ------------------ UI ------------------
  return (
    <div className="container">
      {/* Top Menu */}
      <div className="top-menu">
        <div className="menu-item-box">
          <div className="menu-label">Players</div>
          <div className="menu-value">{players}</div>
        </div>
        <div className="menu-item-box">
          <div className="menu-label">Bet</div>
          <div className="menu-value">{stake}</div>
        </div>
        <div className="menu-item-box">
          <div className="menu-label">Win</div>
          <div className="menu-value">{winAmount}</div>
        </div>
        <div className="menu-item-box">
          <div className="menu-label">Call</div>
          <div className="menu-value">{calledNumbers.length}</div>
        </div>

        {/* Mute Button */}
        <div
          className="menu-item-box mute-button"
          onClick={() => setMuted(!muted)}
          title={muted ? "Unmute" : "Mute"}
        >
          {muted ? "🔇" : "🔊"}
        </div>

      </div>

      <div className="main-content">
        {/* Leftside Board */}
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
            {["B", "I", "N", "G", "O"].map((col, idx) => {
              const start = idx * 15 + 1;
              return (
                <div key={col} className="board-column">
                  {Array.from({ length: 15 }, (_, i) => {
                    const num = start + i;
                    const formatted = formatBingoNumber(num);
                    const isCalled = calledNumbers.includes(formatted);
                    return (
                      <div
                        key={num}
                        className={`number-box ${isCalled ? "called" : ""}`}
                        onClick={() => playAudio(formatted)} // replay audio on click
                      >
                        {num}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Cartela */}
        <div className="cartela-wrapper">
           {/* Countdown above current ball */}
          {!gameStarted && countdown !== null && (
  <div className="countdown-above-ball">
    <div className="timer-circle">
      <span className="timer-value">{countdown}</span>
    </div>
  </div>
)}
          <div

            className={`current-ball pulse ${
              currentNumber
                ? getBingoLetter(parseInt(currentNumber.slice(1)))
                : ""
            }`}
          >
            {currentNumber ?? "--"}
            <div className="highlight highlight1"></div>
            <div className="highlight highlight2"></div>
            <div className="highlight highlight3"></div>
          </div>

          <div className="waiting-rectangle">
            {!gameStarted ? (
              "Waiting for first ball"
            ) : (
              <div className="rolling-numbers">
                {rollingNumbers.map((num, idx) => (
                  <div
                    key={idx}
                    className={`rolling-number ${getBingoLetter(
                      parseInt(num.slice(1))
                    )}`}
                    onClick={() => playAudio(num)} // replay old calls
                  >
                    {num}
                  </div>
                ))}
              </div>
            )}
          </div>

          <h4 className="cartela-title">Cartela: #{cartelaNumber}</h4>

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
              {playerCard.flat().map((num, idx) => {
                const row = Math.floor(idx / 5);
                const col = idx % 5;
                const isCenter = row === 2 && col === 2;
                const marked =
                  isCenter || markedNumbers.includes(formatBingoNumber(num));
                const blink = blinkNumbers.includes(formatBingoNumber(num));
                return (
                  <div
                    key={idx}
                    className={`number-box ${marked ? "marked" : "unmarked"} ${blink ? "blink" : ""
                    }`}
                    onClick={() => handleMarkNumber(num)}
                  >
                    {isCenter ? "*" : num}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <button
        className="bingo-button"
        onClick={() => {
          socket.current.emit("bingoWin", {
            userId,
            stake,
            //ticket: playerTicket,
          });
        }}
        disabled={!gameStarted}
      >
        🎉 Bingo
      </button>

      <div className="bottom-buttons">
        <button
          className="action-btn refresh-button"
          onClick={() => {
            socket.current.emit("refreshGame", { userId, stake });
          }}
          title="Refresh"
        >
          🔄 Refresh
        </button>
        <button
          className="action-btn leave-button"
          onClick={() => navigate("/")}
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

      {showPopup && winnerInfo && (
        <WinModal
          username={winnerInfo.username}
          amount={winnerInfo.prize}
             cartela={winnerInfo.cartela}        // ✅ use winner’s cartela from socket
          cartelaNumber={winnerInfo.cartelaNumber}
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