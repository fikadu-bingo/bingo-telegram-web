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
  } = location.state ?? {};

  // Use username from props or fallback from localStorage or "User"
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

  const socket = useRef(null);

  // Connect socket and setup event handlers for this gameId
  useEffect(() => {
    if (!gameId || !username) {
      alert("Invalid game data. Returning to home...");
      navigate("/");
      return;
    }

    socket.current = io("https://bingo-server-rw7p.onrender.com", {
      transports: ["websocket"],
    });

    // Join the specific game room by gameId and userId (username)
    socket.current.emit("joinGame", { gameId, userId: username });

    // Listen to countdown updates for this game
    socket.current.on("countdownUpdate", (time) => {
      setCountdown(time);
      if (time === 0) {
        setGameStarted(true);
      }
    });

    // Listen for number called event in this game
    socket.current.on("numberCalled", (number) => {
      setCurrentNumber(number);
      setCalledNumbers((prev) => {
        if (!prev.includes(number)) {
          return [...prev, number];
        }
        return prev;
      });
    });

    // Update players count for this game
    socket.current.on("playerListUpdated", ({ players: playerList }) => {
      setPlayers(playerList.length);
    });

    // Update win amount dynamically (stake * players * 0.8)
    socket.current.on("winAmountUpdated", (amount) => {
      setWinAmount(`Br${amount}`);
    });

    // Listen for game started event
    socket.current.on("gameStarted", () => {
      setGameStarted(true);
    });

    // Listen for game won event
    socket.current.on("gameWon", ({ userId }) => {
      if (userId === username) {
        setWinner(true);
        setShowPopup(true);
      }
    });

    // Automatically start calling numbers when countdown reaches 0 (server logic)
    // If server doesn't handle it, can emit startGame here
    socket.current.on("countdownEnded", () => {
      setGameStarted(true);
      socket.current.emit("startCallingNumbers", { gameId });
    });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
        socket.current = null;
      }
    };
  }, [gameId, username, navigate]);

  // Redirect home if no card data
  useEffect(() => {
    if (!card) {
      alert("No card data found. Returning...");
      navigate("/");
    }
  }, [card, navigate]);

  // Bingo win check logic - runs on calledNumbers update
  useEffect(() => {
    if (winner) return; // Already have winner, skip

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
    }// Check columns
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
      setWinner(true);

      const prize = stake * players * 0.8;

      // Update local balance
      const initialBalance = parseFloat(localStorage.getItem("balance") ?? "0");
      const updatedBalance = initialBalance + prize;
      localStorage.setItem("balance", updatedBalance);

      setWinAmount(`Br${prize}`);
      setShowPopup(true);

      // Notify server of bingo win
      if (socket.current) {
        socket.current.emit("bingoWin", { gameId, userId: username });
      }
    }
  }, [calledNumbers, playerCard, stake, players, winner, gameId, username]);

  // Update win amount when players or stake changes
  useEffect(() => {
    const totalWin = stake * players * 0.8;
    setWinAmount(`Br${totalWin}`);
  }, [players, stake]);

  // Prepare the marked cartela data for WinModal
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
              const row = Math.floor(idx / 5);const col = idx % 5;
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
            >
              🎉 Bingo
            </button>
            <button onClick={() => navigate("/")} className="action-btn">
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