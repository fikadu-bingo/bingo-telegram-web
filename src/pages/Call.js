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

  const userId =
    stateUserId ?? localStorage.getItem("userId") ?? "User";
  const username =
    stateUsername ?? localStorage.getItem("firstName") ?? "User";

  const [calledNumbers, setCalledNumbers] = useState([]);
  const [currentNumber, setCurrentNumber] = useState(null);
  const [playerCard, setPlayerCard] = useState(card ?? []);
  const [countdown, setCountdown] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [winnerInfo, setWinnerInfo] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [players, setPlayers] = useState(1);
  const [winAmount, setWinAmount] = useState("Br0");

  const socket = useRef(null);

  useEffect(() => {
    if (!gameId || !userId) {
      alert("Invalid game data. Returning to home...");
      navigate("/");
      return;
    }

    socket.current = io("https://bingo-server-rw7p.onrender.com", {
      transports: ["websocket"],
    });

    // Send player's 5x5 card as ticket on joinGame
    socket.current.emit("joinGame", { userId, username, stake, ticket: playerCard });

    socket.current.on("playerListUpdated", ({ players: playerList }) => {
      setPlayers(playerList.length);
    });

    socket.current.on("countdownUpdate", (time) => {
      setCountdown(time);
      if (time === 0) {
        setGameStarted(true);
      }
    });

    socket.current.on("countdownStopped", () => {
      setCountdown(null);
      setGameStarted(false);
    });

    socket.current.on("numberCalled", (number) => {
      setCurrentNumber(number);
      setCalledNumbers((prev) => {
        if (!prev.includes(number)) return [...prev, number];
        return prev;
      });
    });

    socket.current.on("winAmountUpdate", (amount) => {
      setWinAmount(`Br${amount}`);
    });

    socket.current.on("gameStarted", () => {
      setGameStarted(true);
    });

    socket.current.on(
      "gameWon",
      ({ userId: winnerId, username: winnerUsername }) => {
        setWinnerInfo({
          userId: winnerId,
          username: winnerUsername,
          prize: winAmount, // Can show current winAmount; server sends no prize in payload
        });
        setShowPopup(true);
      }
    );

    socket.current.on("balanceChange", ({ balances }) => {
      if (balances && balances[userId] !== undefined) {
        localStorage.setItem("balance", balances[userId]);
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
        socket.current.off("playerListUpdated");
        socket.current.off("countdownUpdate");
        socket.current.off("countdownStopped");
        socket.current.off("numberCalled");
        socket.current.off("winAmountUpdate");
        socket.current.off("gameStarted");
        socket.current.off("gameWon");
        socket.current.off("balanceChange");
        socket.current.off("gameReset");
        socket.current.disconnect();
        socket.current = null;
      }
    };
  }, [gameId, userId, username, stake, navigate, playerCard]);

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
          username={winnerInfo.username}
          amount={winnerInfo.prize}
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