import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import logo from "../assets/logo.png";
import WinModal from "../components/WinModal";
import "./Call.css";

const COUNTDOWN_START = 50;
const CALL_INTERVAL = 1000;

function Call() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    card,
    stake,
    gameId,
    cartelaNumber,
    username: stateUsername,
  } = location.state ?? {};

  const username =
    stateUsername ?? localStorage.getItem("firstName") ?? "User";

  const [calledNumbers, setCalledNumbers] = useState([]);
  const [currentNumber, setCurrentNumber] = useState(null);
  const [playerCard, setPlayerCard] = useState(card ?? []);
  const [countdown, setCountdown] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [winnerInfo, setWinnerInfo] = useState(null); // { userId, prize }
  const [showPopup, setShowPopup] = useState(false);
  const [players, setPlayers] = useState(1);
  const [winAmount, setWinAmount] = useState("Br0");
  const [numbersToCall, setNumbersToCall] = useState([]);
  const [isCallingNumbers, setIsCallingNumbers] = useState(false);

  const socket = useRef(null);
  const callIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  useEffect(() => {
    if (!gameId || !username) {
      alert("Invalid game data. Returning to home...");
      navigate("/");
      return;
    }

    // Connect to server
    socket.current = io("https://bingo-server-rw7p.onrender.com", {
      transports: ["websocket"],
    });

    // Join game room with user info and stake
    socket.current.emit("joinGame", { userId: username, username, stake });

    // Update players list
    socket.current.on("playerListUpdated", ({ players: playerList }) => {
      setPlayers(playerList.length);

      // Auto start countdown if enough players and not started yet
      if (playerList.length >= 2 && countdown === null && !gameStarted) {
        startCountdown();
      }
    });

    // Update countdown timer from server
    socket.current.on("countdownUpdate", (time) => {
      setCountdown(time);
      if (time === 0) {
        startCallingNumbers();
      }
    });

    socket.current.on("countdownStopped", () => {
      setCountdown(null);
      setGameStarted(false);
    });

    // Update when new number called
    socket.current.on("numberCalled", (number) => {
      setCurrentNumber(number);
      setCalledNumbers((prev) => {
        if (!prev.includes(number)) return [...prev, number];
        return prev;
      });
    });

    // Update win amount (80% of total stake)
    socket.current.on("winAmountUpdate", (amount) => {
      setWinAmount(`Br${amount}`);
    });

    // Mark game as started
    socket.current.on("gameStarted", () => {
      setGameStarted(true);
    });

    // Handle game won event with winner info & balances for all players
    socket.current.on("gameWon", ({ winnerId, prize, balances }) => {
      setWinnerInfo({ userId: winnerId, prize });
      setShowPopup(true);

      // Update local balance for this user if provided
      if (balances && balances[username] !== undefined) {
        localStorage.setItem("balance", balances[username]);
      }
    });

    // Listen for balanceChange event to update local balance dynamically
    socket.current.on("balanceChange", ({ balances }) => {
      if (balances && balances[username] !== undefined) {
        localStorage.setItem("balance", balances[username]);
      }
    });

    // Reset game state on server reset event
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
        socket.current.emit("leaveGame", { userId: username });
        socket.current.disconnect();
        socket.current = null;
      }
      clearInterval(countdownIntervalRef.current);
      clearInterval(callIntervalRef.current);
    };
  }, [gameId, username, stake, countdown, gameStarted, navigate]);

  // Start countdown locally (this is mainly UI effect; actual countdown sync from server)
  const startCountdown = () => {
    setCountdown(COUNTDOWN_START);
    let timeLeft = COUNTDOWN_START;

    countdownIntervalRef.current = setInterval(() => {
      timeLeft--;
      setCountdown(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(countdownIntervalRef.current);
        startCallingNumbers();
      }
    }, 1000);
  };

  // Start calling numbers automatically (client-side UI)
  const startCallingNumbers = () => {
    setGameStarted(true);
    let nums = Array.from({ length: 100 }, (_, i) => i + 1);
    nums = shuffleArray(nums);
    setNumbersToCall(nums);
    setCalledNumbers([]);
    setCurrentNumber(null);
    setIsCallingNumbers(true);

    // Inform server that game started
    socket.current.emit("gameStarted", { gameId });

    let index = 0;
    callIntervalRef.current = setInterval(() => {
      if (index >= nums.length) {
        clearInterval(callIntervalRef.current);
        setIsCallingNumbers(false);
        return;
      }
      const number = nums[index];
      setCurrentNumber(number);
      setCalledNumbers((prev) => [...prev, number]);

      socket.current.emit("numberCalled", { gameId, number });

      index++;
    }, CALL_INTERVAL);
  };

  // Fisher-Yates shuffle
  const shuffleArray = (array) => {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Check bingo pattern for current player card and called numbers
  useEffect(() => {
    if (!gameStarted || winnerInfo) return;

    const isMarked = (num, row, col) => {
      if (row === 2 && col === 2) return true; // center free space
      return calledNumbers.includes(num);
    };

    let bingo = false;

    // Check rows
    for (let i = 0; i < 5; i++) {
      if (playerCard[i]?.every((num, j) => isMarked(num, i, j))) {
        bingo = true;
        break;
      }
    }

    // Check columns
    if (!bingo) {
      for (let j = 0; j < 5; j++) {
        let colWin = true;
        for (let i = 0; i < 5; i++) {
          if (!isMarked(playerCard[i]?.[j], i, j)) {
            colWin = false;
            break;
          }
        }
        if (colWin) {
          bingo = true;
          break;
        }
      }
    }

    // Check main diagonal
    if (!bingo) {
      bingo = [0, 1, 2, 3, 4].every((i) => isMarked(playerCard[i]?.[i], i, i));
    }

    // Check anti diagonal
    if (!bingo) {
      bingo = [0, 1, 2, 3, 4].every(
        (i) => isMarked(playerCard[i]?.[4 - i], i, 4 - i)
      );
    }

    if (bingo) {
      socket.current.emit("bingoWin", { gameId, userId: username });
      // Wait for server to broadcast "gameWon" event
    }
  }, [calledNumbers, playerCard, gameStarted, winnerInfo, gameId, username]);

  // Calculate and set win amount (80% of total stakes)
  useEffect(() => {
    if (players && stake) {
      const totalWin = stake * players * 0.8;
      setWinAmount(`Br${totalWin.toFixed(2)}`);
    }
  }, [players, stake]);

  // Prepare marked cartela for WinModal
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
        <div>Win: {winAmount}</div>
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
              onClick={() => alert("Bingo button logic (coming soon)!")}
              className="action-btn"
              disabled={!gameStarted || winnerInfo !== null}
            >
              🎉 Bingo
            </button>
            <button
              onClick={() => navigate("/")}
              className="action-btn"
              disabled={gameStarted && winnerInfo === null}
            >
              🚪 Leave
            </button>
          </div>
        </div>
      </div>

      {showPopup && winnerInfo && (
        <WinModal
          username={winnerInfo.userId}
          amount={`Br${winnerInfo.prize}`}
          cartela={getMarkedCartela()}
          cartelaNumber={cartelaNumber}
          onPlayAgain={() => {
            setWinnerInfo(null);
            setShowPopup(false);
            navigate("/");
          }}
        />
      )}
    </div>
  );
}

export default Call;