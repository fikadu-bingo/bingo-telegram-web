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

  const username =
    location.state?.username ?? localStorage.getItem("firstName") ?? "User";

  const [calledNumbers, setCalledNumbers] = useState([]);
  const [currentNumber, setCurrentNumber] = useState(null);
  const [playerCard, setPlayerCard] = useState(card ?? []);
  const [countdown, setCountdown] = useState(50);
  const [gameStarted, setGameStarted] = useState(false);
  const [winner, setWinner] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [players, setPlayers] = useState(1);
  const [winAmount, setWinAmount] = useState("Br0");

  // Use useRef to create socket once
  const socket = useRef(null);

  useEffect(() => {
    socket.current = io("https://bingo-server-rw7p.onrender.com", {
      transports: ["websocket"],
    });

    if (gameId && username) {
      socket.current.emit("joinGame", { gameId, userId: username });
    }

    socket.current.on("numberCalled", (number) => {
      setCurrentNumber(number);
      setCalledNumbers((prev) => {
        if (!prev.includes(number)) {
          return [...prev, number];
        }
        return prev;
      });
    });

    socket.current.on("playerListUpdated", ({ players: playerList }) => {
      setPlayers(playerList.length);
    });

    socket.current.on("winAmountUpdated", (amount) => {
      setWinAmount(`Br${amount}`);
    });

    socket.current.on("gameStarted", () => {
      setGameStarted(true);
    });

    socket.current.on("gameWon", ({ userId }) => {
      if (userId === username) {
        setWinner(true);
        setShowPopup(true);
      }
    });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [gameId, username]);

  useEffect(() => {
    if (!card) {
      alert("No card data found. Returning...");
      navigate("/");
    }
  }, [card, navigate]);

  useEffect(() => {
    if (countdown > 0 && !gameStarted) {
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, gameStarted]);

  // Calling numbers logic handled by server; this client just listens and displays

  useEffect(() => {
    const isMarked = (num, row, col) => {
      if (row === 2 && col === 2) return true;
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
      bingo = [0, 1, 2, 3, 4].every((i) =>
        isMarked(playerCard[i]?.[4 - i], i, 4 - i)
      );
    }

    if (bingo && !winner) {
      setWinner(true);
      const prize = stake * players * 0.8;

      const initialBalance = parseFloat(localStorage.getItem("balance") ?? "0");
      const updatedBalance = initialBalance + prize;
      localStorage.setItem("balance", updatedBalance);

      setWinAmount(`Br${prize}`);
      setShowPopup(true);
      socket.current.emit("bingoWin", { gameId, userId: username });
    }
  }, [calledNumbers, playerCard, stake, players, winner, gameId, username]);
  // Update win amount if players or stake changes
  useEffect(() => {
    const totalWin = stake * players * 0.8;
    setWinAmount(`Br${totalWin}`);
  }, [players, stake]);

  // Helper to get marked cartela for WinModal
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
          {countdown > 0 && !gameStarted && (
            <div className="circle">
              <div style={{ fontSize: "12px" }}>Wait</div>
              <div>{countdown}</div>
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
          cartela={getMarkedCartela()} // pass marked cartela
          cartelaNumber={cartelaNumber}
          onPlayAgain={() => navigate("/")}
        />
      )}
    </div>
  );
}

export default Call;