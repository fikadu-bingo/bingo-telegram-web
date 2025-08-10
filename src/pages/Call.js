import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import logo from "../assets/logo.png";
import WinModal from "../components/WinModal";
import "./Call.css";

const COUNTDOWN_START = 50; // seconds
const CALL_INTERVAL = 1000; // 1 second between called numbers
const WIN_MODAL_DURATION = 5000; // 5 seconds

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
  const [winner, setWinner] = useState(false);
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

    socket.current = io("https://bingo-server-rw7p.onrender.com", {
      transports: ["websocket"],
    });

    // Join game room
    socket.current.emit("joinGame", { gameId, userId: username });

    // Players list updates, set players count
    socket.current.on("playerListUpdated", ({ players: playerList }) => {
      setPlayers(playerList.length);
      // Start countdown only if players >= 2 and countdown not started yet and game not started
      if (playerList.length >= 2 && countdown === null && !gameStarted) {
        startCountdown();
      }
    });

    // Countdown update from server (optional fallback)
    socket.current.on("countdownUpdate", (time) => {
      setCountdown(time);
      if (time === 0) {
        startCallingNumbers();
      }
    });

    // Number called event - update called numbers and current number
    socket.current.on("numberCalled", (number) => {
      setCurrentNumber(number);
      setCalledNumbers((prev) => {
        if (!prev.includes(number)) return [...prev, number];
        return prev;
      });
    });

    // Win amount update (stake * players * 0.8)
    socket.current.on("winAmountUpdated", (amount) => {
      setWinAmount(`Br${amount}`);
    });

    // Game started event
    socket.current.on("gameStarted", () => {
      setGameStarted(true);
    });

    // Game won event
    socket.current.on("gameWon", ({ userId }) => {
      if (userId === username) {
        handleWin();
      }
    });

    // Clean up on unmount
    return () => {
      if (socket.current) {
        socket.current.emit("leaveGame", { gameId, userId: username });
        socket.current.disconnect();
        socket.current = null;
      }
      clearInterval(countdownIntervalRef.current);
      clearInterval(callIntervalRef.current);
    };
  }, [gameId, username]);

  // Start countdown locally if no server countdown (non-concurrent enforcement)
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

  // Start calling numbers automatically
  const startCallingNumbers = () => {
    setGameStarted(true);
    // Generate shuffled numbers 1-100 for calling
    let nums = Array.from({ length: 100 }, (_, i) => i + 1);
    nums = shuffleArray(nums);
    setNumbersToCall(nums);
    setCalledNumbers([]);
    setCurrentNumber(null);
    setIsCallingNumbers(true);

    // Emit gameStarted to server so others sync
    socket.current.emit("gameStarted", { gameId });

    // Start interval to call numbers one by one
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

      // Emit numberCalled event to server
      socket.current.emit("numberCalled", { gameId, number });

      index++;
    }, CALL_INTERVAL);
  };

  // Helper to shuffle array
  const shuffleArray = (array) => {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Handle user win locally
  const handleWin = () => {
    setWinner(true);
    setShowPopup(true);

    // Update local balance for winner
    const initialBalance = parseFloat(localStorage.getItem("balance") ?? "0");
    const prize = stake * players * 0.8;
    const updatedBalance = initialBalance + prize;
    localStorage.setItem("balance", updatedBalance);
    setWinAmount(`Br${prize}`);

    // Deduct stake from others - we simulate here, backend should do this securely
    // You can implement socket emit for stake deduction to others or handle in backend

    // Auto close winner modal after 5 seconds and navigate home
    setTimeout(() => {
      setShowPopup(false);
      navigate("/");
    }, WIN_MODAL_DURATION);
  };

  // Bingo win check logic
  useEffect(() => {
    if (!gameStarted || winner) return;

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

    // Check diagonals
    if (!bingo) {
      bingo = [0, 1, 2, 3, 4].every((i) => isMarked(playerCard[i]?.[i], i, i));
    }

    if (!bingo) {
      bingo = [0, 1, 2, 3, 4].every(
        (i) => isMarked(playerCard[i]?.[4 - i], i, 4 - i)
      );
    }

    if (bingo) {
      // Emit bingo win event to server
      socket.current.emit("gameWon", { gameId, userId: username });
      handleWin();
    }
  }, [calledNumbers, playerCard, stake, players, winner, gameStarted]);

  // Update win amount display on players or stake change
  useEffect(() => {
    const totalWin = stake * players * 0.8;
    setWinAmount(`Br${totalWin}`);
  }, [players, stake]);

  // Prepare marked card for modal
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
              <div key={letter} className={`bingo-letter bingo-${letter.toLowerCase()}`}>
                {letter}
              </div>
            ))}
          </div>

          <div className="board-grid">
            {Array.from({ length: 100 }, (_, i) => i + 1).map((num) => (
              <div
                key={num}
                className={`number-box ${calledNumbers.includes(num) ? "marked" : "unmarked"}`}
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
              <div key={letter} className={`bingo-letter bingo-${letter.toLowerCase()}`}>
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
              disabled={!gameStarted || winner}
            >
              🎉 Bingo
            </button>
            <button onClick={() => navigate("/")} className="action-btn" disabled={gameStarted && !winner}>
              🚪 Leave
            </button>
          </div>
        </div>
      </div>

      {showPopup && (
        <WinModal
          username={username}
          amount={winAmount}
          cartela={getMarkedCartela()}
          cartelaNumber={cartelaNumber}
          onPlayAgain={() => navigate("/")}
        />
      )}
    </div>
  );
}

export default Call;